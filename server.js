const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ roomCode, playerName }) => {

    roomCode = String(roomCode || "").trim().toUpperCase();

    playerName = String(playerName || "").trim().slice(0, 20);

    if (!roomCode || !playerName) {

      socket.emit("errorMessage", "اكتب اسمك ورمز الغرفة");

      return;

    }

    if (!rooms[roomCode]) rooms[roomCode] = { players: [] };

    const room = rooms[roomCode];

    if (room.players.length >= 20) {

      socket.emit("errorMessage", "الغرفة ممتلئة");

      return;

    }

    room.players.push({

      id: socket.id,

      name: playerName

    });

    socket.join(roomCode);

    socket.data.roomCode = roomCode;

    io.to(roomCode).emit("playersUpdate", room.players.map(p => p.name));

  });

  socket.on("disconnect", () => {

    const roomCode = socket.data.roomCode;

    if (!roomCode || !rooms[roomCode]) return;

    rooms[roomCode].players =

      rooms[roomCode].players.filter(p => p.id !== socket.id);

    io.to(roomCode).emit(

      "playersUpdate",

      rooms[roomCode].players.map(p => p.name)

    );

    if (rooms[roomCode].players.length === 0) delete rooms[roomCode];

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {

  console.log(`Mafia server running on port ${PORT}`);

});
