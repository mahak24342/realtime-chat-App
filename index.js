const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {}; // Store users and their rooms

// Serve static files
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // User joins with a username
  socket.on('join', ({ username, room }) => {
    socket.username = username;
    socket.room = room;

    // Add user to the room
    if (!users[room]) users[room] = [];
    users[room].push(username);

    socket.join(room);
    socket.to(room).emit('message', `${username} has joined the room.`);
    io.to(room).emit('updateUsers', users[room]);
  });

  // Handle typing event
  socket.on('typing', () => {
    socket.to(socket.room).emit('typing', `${socket.username} is typing...`);
  });

  // Handle message event
  socket.on('chat message', (msg) => {
    io.to(socket.room).emit('chat message', { username: socket.username, message: msg });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.room) {
      users[socket.room] = users[socket.room].filter((user) => user !== socket.username);
      io.to(socket.room).emit('updateUsers', users[socket.room]);
      io.to(socket.room).emit('message', `${socket.username} has left the room.`);
    }
    console.log('A user disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
