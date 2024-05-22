import { Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from './socket';
import { useNavigate } from "react-router-dom";

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
    const navigate = useNavigate();
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [roomInput, setRoomInput] = useState(''); // input state
    const [roomError, setRoomError] = useState('');

    // Function to handle the logout action
    const logout = () => {
        localStorage.clear();
        window.location.reload();
        navigate("/");
    };

    // Function to handle the continuation from the dialog
    const handleJoinRoom = () => {
        if (!roomInput.trim()) {
            setRoomError("Room ID cannot be empty.");
            return;
        }
        socket.emit("joinRoom", { roomId: roomInput.trim() }, (response) => {
            if (response.error) {
                setRoomError(response.message);
                return;
            }
            setRoom(response.roomId);
            setPlayers(response.players);
            setOrientation("black"); // This could be dynamic based on the response if needed
            setRoomDialogOpen(false);
            navigate("/game");
        });
    };

    return (
        <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ py: 1, height: "100vh" }}
        >
            <CustomDialog
                open={roomDialogOpen}
                handleClose={() => setRoomDialogOpen(false)}
                title="Select Room to Join"
                contentText="Enter a valid room ID to join the room"
                handleContinue={handleJoinRoom}
            >
                <TextField
                    autoFocus
                    margin="dense"
                    id="room"
                    label="Room ID"
                    name="room"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    type="text"
                    fullWidth
                    variant="standard"
                    error={Boolean(roomError)}
                    helperText={roomError || 'Enter a room ID'}
                />
            </CustomDialog>

            {/* Button to log out */}
            <Button onClick={logout}>Log Out</Button>

            {/* Button to start a new game */}
            <Button
                variant="contained"
                onClick={() => {
                    socket.emit("createRoom", (response) => {
                        console.log(response);
                        setRoom(response);
                        setOrientation("white");
                        navigate("/game");
                    });
                }}
            >
                Start a game
            </Button>

            {/* Button to open the join game dialog */}
            <Button onClick={() => setRoomDialogOpen(true)}>
                Join a game
            </Button>
        </Stack>
    );
}
