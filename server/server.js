require('dotenv').config();

const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const express = require('express');
const { Server } = require("socket.io");
const http = require('http');
const cors = require('cors');
const { v4: uuidV4 } = require('uuid');
const logger = require('./logger');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to the database
db.connect(err => {
    if (err) {
        logger.error('Error connecting to the database: ' + err.stack);
        return;
    }
    logger.info('Connected to database.');
});

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(socket) {
        const roomId = uuidV4();
        this.rooms.set(roomId, {
            roomId,
            players: [{ id: socket.id, username: socket.data?.username }]
        });
        logger.info(`Room created with ID: ${roomId}`);
        return roomId;
    }

    joinRoom(socket, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            logger.warn(`Attempt to join non-existent room ID: ${roomId}`);
            return { error: true, message: 'room does not exist' };
        }
        if (room.players.length <= 0) {
            logger.warn(`Attempt to join an empty room ID: ${roomId}`);
            return { error: true, message: 'room is empty' };
        }
        if (room.players.length >= 2) {
            logger.warn(`Attempt to join a full room ID: ${roomId}`);
            return { error: true, message: 'room is full' };
        }

        room.players.push({ id: socket.id, username: socket.data?.username });
        this.rooms.set(roomId, room);
        logger.info(`Player joined room ID: ${roomId}`);
        return { error: false, room };
    }

    handleDisconnect(socket) {
        for (let room of this.rooms.values()) {
            const userInRoom = room.players.find(player => player.id === socket.id);
            if (userInRoom) {
                if (room.players.length < 2) {
                    this.rooms.delete(room.roomId);
                    logger.info(`Room ID: ${room.roomId} deleted due to player disconnect`);
                } else {
                    socket.to(room.roomId).emit("playerDisconnected", userInRoom);
                    logger.info(`Player disconnected from room ID: ${room.roomId}`);
                }
                return;
            }
        }
    }

    async closeRoom(io, roomId) {
        const clientSockets = await io.in(roomId).fetchSockets();
        for (let s of clientSockets) {
            s.leave(roomId);
        }
        this.rooms.delete(roomId);
        logger.info(`Room ID: ${roomId} closed`);
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
}

class ServerApp {
    constructor(port) {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());

        this.server = http.createServer(this.app);
        this.port = port || 8081;
        this.io = new Server(this.server, { cors: '*' });
        this.roomManager = new RoomManager();
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            logger.info(`${socket.id} connected`);

            socket.on('username', (username) => {
                logger.info(`Username set for socket ID ${socket.id}: ${username}`);
                socket.data.username = username;
            });

            socket.on('createRoom', async (callback) => {
                const roomId = this.roomManager.createRoom(socket);
                await socket.join(roomId);
                callback(roomId);
                logger.info(`Socket ID ${socket.id} created and joined room ID: ${roomId}`);
            });

            socket.on('joinRoom', async (args, callback) => {
                const { error, message, room } = this.roomManager.joinRoom(socket, args.roomId);
                if (error) {
                    if (callback) callback({ error, message });
                    logger.warn(`Socket ID ${socket.id} failed to join room ID: ${args.roomId} - ${message}`);
                    return;
                }

                await socket.join(args.roomId);
                callback(room);
                socket.to(args.roomId).emit('opponentJoined', room);
                logger.info(`Socket ID ${socket.id} joined room ID: ${args.roomId}`);
            });

            socket.on('move', (data) => {
                socket.to(data.room).emit('move', data.move);
                logger.info(`Move made in room ID: ${data.room} - Move: ${data.move}`);
            });

            socket.on("disconnect", () => {
                this.roomManager.handleDisconnect(socket);
                logger.info(`Socket ID ${socket.id} disconnected`);
            });

            socket.on("closeRoom", async (data) => {
                await this.roomManager.closeRoom(this.io, data.roomId);
                socket.to(data.roomId).emit("closeRoom", data);
                logger.info(`Socket ID ${socket.id} closed room ID: ${data.roomId}`);
            });
        });
    }

    setupRoutes() {
        // User login
        this.app.post('/login', async (req, res) => {
            const { username, password } = req.body;
            const query = 'SELECT * FROM users WHERE username = ?';
            db.query(query, [username], async (err, result) => {
                if (err) {
                    logger.error('Database error during login:', err);
                    res.status(500).send('Database error');
                } else if (result.length > 0) {
                    const match = await bcrypt.compare(password, result[0].password);
                    if (match) {
                        logger.info(`User ${username} logged in successfully`);
                        res.status(200).send({ message: 'Login successful', user: result[0] });
                    } else {
                        logger.warn(`Invalid credentials for user ${username}`);
                        res.status(401).send('Invalid credentials');
                    }
                } else {
                    logger.warn(`User not found: ${username}`);
                    res.status(404).send('User not found');
                }
            });
        });

        // User registration
        this.app.post('/register', async (req, res) => {
            const { username, password } = req.body;
            if (!username || !password) {
                logger.error('Username or password not provided');
                console.error('Username or password not provided');
                return res.status(400).json({ error: 'Username and password are required' });
            }
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
                db.query(query, [username, hashedPassword], (err, result) => {
                    if (err) {
                        logger.error('Error inserting user into the database:', err);
                        res.status(500).json({ error: 'Database error' });
                    } else {
                        logger.info(`User registered successfully: ${username}`);
                        res.status(201).send({ message: 'User registered successfully', userId: result.insertId });
                    }
                });
            } catch (error) {
                logger.error('Error during user registration:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }

    start() {
        this.setupRoutes();
        this.setupSocketEvents();
        this.server.listen(this.port, () => {
            logger.info(`listening on *:${this.port}`);
        });
    }
}

const port = process.env.PORT || 8081;
const serverApp = new ServerApp(port);
serverApp.start();
