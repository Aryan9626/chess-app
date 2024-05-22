require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require("socket.io");
const { v4: uuidV4 } = require('uuid');
const http = require('http');

const app = express();
const server = http.createServer(app);


// Added: Middleware to parse JSON request bodies
app.use(bodyParser.json());
// set port to value received from environment variable or 8080 if null
const port = process.env.PORT || 8081

// Added: CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Change this to your frontend's origin
  methods: ['GET', 'POST'],
  credentials: true
}));

// Added: Session management configuration
app.use(session({
  secret: 'your_session_secret', // Change this to a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Added: MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Added: Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Added: User registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
  
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(201).json({ message: 'User registered successfully' });
  });
});

// Added: User login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = { id: user.id, username: user.username };
    res.status(200).json({ message: 'Login successful' });
  });
});

// Added: User logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Added: Sample authenticated endpoint
app.get('/profile', isAuthenticated, (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.session.user });
});

// Upgrade HTTP server to WebSocket server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Change this to your frontend's origin
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log(socket.id, 'connected');
  
  socket.on('username', (username) => {
    console.log('username:', username);
    socket.data.username = username;
  });

  socket.on('createRoom', async (callback) => {
    const roomId = uuidV4();
    await socket.join(roomId);
    
    rooms.set(roomId, {
      roomId,
      players: [{ id: socket.id, username: socket.data?.username }]
    });

    callback(roomId);
  });

  socket.on('joinRoom', async (args, callback) => {
    const room = rooms.get(args.roomId);
    let error, message;
    
    if (!room) {
      error = true;
      message = 'Room does not exist';
    } else if (room.players.length >= 2) {
      error = true;
      message = 'Room is full';
    }

    if (error) {
      if (callback) {
        callback({ error, message });
      }
      return;
    }

    await socket.join(args.roomId);

    const roomUpdate = {
      ...room,
      players: [
        ...room.players,
        { id: socket.id, username: socket.data?.username },
      ],
    };

    rooms.set(args.roomId, roomUpdate);

    callback(roomUpdate);
    socket.to(args.roomId).emit('opponentJoined', roomUpdate);
  });

  socket.on('move', (data) => {
    socket.to(data.room).emit('move', data.move);
  });

  socket.on("disconnect", () => {
    const gameRooms = Array.from(rooms.values());
    
    gameRooms.forEach((room) => {
      const userInRoom = room.players.find((player) => player.id === socket.id);
      
      if (userInRoom) {
        if (room.players.length < 2) {
          rooms.delete(room.roomId);
          return;
        }

        socket.to(room.roomId).emit("playerDisconnected", userInRoom);
      }
    });
  });

  socket.on("closeRoom", async (data) => {
    socket.to(data.roomId).emit("closeRoom", data);
    
    const clientSockets = await io.in(data.roomId).fetchSockets();
    
    clientSockets.forEach((s) => {
      s.leave(data.roomId);
    });
    
    rooms.delete(data.roomId);
  });
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});