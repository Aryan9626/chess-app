import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import Peer from 'simple-peer';
import CustomDialog from "./components/CustomDialog";
import VideoPlayer from "./components/VideoPlayer";
import socket from "./socket";
import { Card, CardContent, Typography, Stack, Box, List, ListItem, ListItemText, ListSubheader } from "@mui/material";

function Game({ players, room, orientation, cleanup }) {
    const chess = useMemo(() => new Chess(), []); // <- 1
    const [fen, setFen] = useState(chess.fen()); // <- 2
    const [over, setOver] = useState("");
    const [peers, setPeers] = useState([]);
    const userVideo = useRef();
    const peersRef = useRef([]);

    const makeAMove = useCallback((move) => {
        try {
            const result = chess.move(move); // update Chess instance
            setFen(chess.fen()); // update fen state to trigger a re-render

            console.log("over, checkmate", chess.isGameOver(), chess.isCheckmate());

            if (chess.isGameOver()) { // check if move led to "game over"
                if (chess.isCheckmate()) { // if reason for game over is a checkmate
                    // Set message to checkmate. 
                    setOver(
                        `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
                    );
                    // The winner is determined by checking which side made the last move
                } else if (chess.isDraw()) { // if it is a draw
                    setOver("Draw"); // set message to "Draw"
                } else {
                    setOver("Game over");
                }
            }

            return result;
        } catch (e) {
            return null;
        } // null if the move was illegal, the move object if the move was legal
    }, [chess]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;

            socket.on('userJoined', payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                });

                setPeers(users => [...users, peer]);
            });

            socket.on('receivingReturnedSignal', payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });
        });

        return () => {
            peersRef.current.forEach(p => {
                p.peer.destroy();
            });
        };
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            socket.emit('sendingSignal', { userToSignal, callerID, signal });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            socket.emit('returningSignal', { signal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    // onDrop function
    function onDrop(sourceSquare, targetSquare) {
        // orientation is either 'white' or 'black'. game.turn() returns 'w' or 'b'
        if (chess.turn() !== orientation[0]) return false; // <- 1 prohibit player from moving piece of other player

        if (players.length < 2) return false; // <- 2 disallow a move if the opponent has not joined

        const moveData = {
            from: sourceSquare,
            to: targetSquare,
            color: chess.turn(),
            promotion: "q", // promote to queen where possible
        };

        const move = makeAMove(moveData);

        // illegal move
        if (move === null) return false;

        socket.emit("move", { // <- 3 emit a move event.
            move,
            room,
        }); // this event will be transmitted to the opponent via the server

        return true;
    }

    useEffect(() => {
        socket.on("move", (move) => {
            makeAMove(move); //
        });
    }, [makeAMove]);

    useEffect(() => {
        socket.on('playerDisconnected', (player) => {
            setOver(`${player.username} has disconnected`); // set game over
        });
    }, []);

    useEffect(() => {
        socket.on('closeRoom', ({ roomId }) => {
            if (roomId === room) {
                cleanup();
            }
        });
    }, [room, cleanup]);

    return (
        <Stack>
            <Card>
                <CardContent>
                    <Typography variant="h5">Room ID: {room}</Typography>
                </CardContent>
            </Card>
            <Stack flexDirection="row" sx={{ pt: 2 }}>
                <div className="board" style={{
                    maxWidth: 600,
                    maxHeight: 600,
                    flexGrow: 1,
                }}>
                    <Chessboard
                        position={fen}
                        onPieceDrop={onDrop}
                        boardOrientation={orientation}
                    />
                </div>
                {players.length > 0 && (
                    <Box>
                        <List>
                            <ListSubheader>Players</ListSubheader>
                            {players.map((p) => (
                                <ListItem key={p.id}>
                                    <ListItemText primary={p.username} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
                <video ref={userVideo} autoPlay playsInline />
                {peers.map((peer, index) => (
                    <VideoPlayer key={index} peer={peer} />
                ))}
            </Stack>
            <CustomDialog // Game Over CustomDialog
                open={Boolean(over)}
                title={over}
                contentText={over}
                handleContinue={() => {
                    socket.emit("closeRoom", { roomId: room });
                    cleanup();
                }}
            />
        </Stack>
    );
    
}

export default Game;