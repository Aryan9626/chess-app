import { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Container from "@mui/material/Container";
import Game from "./Game";
import InitGame from "./InitGame";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";
import { TextField } from "@mui/material";
import { Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);

  const [room, setRoom] = useState("");
  const [orientation, setOrientation] = useState("");
  const [players, setPlayers] = useState([]);

  // resets the states responsible for initializing a game
  const cleanup = useCallback(() => {
    setRoom("");
    setOrientation("");
    setPlayers("");
  }, []);

  useEffect(() => {
    socket.on("opponentJoined", (roomData) => {
      console.log("roomData", roomData);
      setPlayers(roomData.players);
    });
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("setName");
    if (name) {
      setLoggedIn(name);
    }
  }, []);

  return (
    <Router>
      <Container>
        <Routes>
          <Route
            path="/"
            element={
              !loggedIn ? (
                <Login setLoggedIn={setLoggedIn} />
              ) : (
                <InitGame
                  setRoom={setRoom}
                  setOrientation={setOrientation}
                  setPlayers={setPlayers}
                />
              )
            }
          />
          <Route
            path="/register"
            element={ <Register/>
            }
          />
          <Route
            path="/game"
            element={
               room ? (
                <Game
                  room={room}
                  orientation={orientation}
                  username={username}
                  players={players}
                  cleanup={cleanup}
                />
              ) : (
                // Redirect to login if not logged in or room not set
                <Navigate to="/" replace />
              )
            }
          />
          {/* Optional catch-all route for handling unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Router>
  );
}