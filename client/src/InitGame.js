import { Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from './socket';
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
    
    useEffect(()=>{
         const fetch = async() =>{
                let apiResponse = await axios.get("")
         }
         fetch()
    },[])

    const navigate = useNavigate()
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [roomInput, setRoomInput] = useState(''); // input state
    const [roomError, setRoomError] = useState('');
    const logout = ()=>{
         localStorage.clear()
         window.location.reload();
        navigate("/")
    }

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
                handleContinue={() => {
                    // join a room
                    if (!roomInput) return; // if given room input is valid, do nothing.
                    socket.emit("joinRoom", { roomId: roomInput }, (r) => {
                        // r is the response from the server
                        if (r.error) return setRoomError(r.message); // if an error is returned in the response set roomError to the error message and exit
                        console.log("response:", r);
                        setRoom(r?.roomId); // set room to the room ID
                        setPlayers(r?.players); // set players array to the array of players in the room
                        setOrientation("black"); // set orientation as black
                        setRoomDialogOpen(false); // close dialog
                    });
                }}
            >
           
                <TextField
                    autoFocus
                    margin="dense"
                    id="room"
                    label="Room ID"
                    name="room"
                    value={roomInput}
                    required
                    onChange={(e) => setRoomInput(e.target.value)}
                    type="text"
                    fullWidth
                    variant="standard"
                    error={Boolean(roomError)}
                    helperText={!roomError ? 'Enter a room ID' : `Invalid room ID: ${roomError}` }
                />
            </CustomDialog>
            {/* Button for starting a game */}
            <Button onClick={logout}>Log Out</Button>
            <Button
                variant="contained"
                onClick={() => {
                    socket.emit("createRoom", (r) => {
                        console.log(r);
                        setRoom(r);
                        setOrientation("white");
                        navigate("/game")
                    });
                }}
            >
                Start a game
            </Button>
            {/* Button for joining a game */}
            <Button
                onClick={() => {
                    setRoomDialogOpen(true)
                }}
            >
                Join a game
            </Button>
        </Stack>
    );
}