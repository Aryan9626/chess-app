CREATE DATABASE chess_app;
USE chess_app;

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    UNIQUE KEY unique_room (room_id)
);

CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    socket_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    room_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
