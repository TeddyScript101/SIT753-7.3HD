const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');
const connectDB = require('./db');
const routes = require('./routes');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const secretAngelSocket = require("./sockets/secretAngelSocket");


const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: Date.now()
  });
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

connectDB();


app.use('/', routes);


const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  secretAngelSocket(io, socket);
});


module.exports = { app, server, io };


if (require.main === module) {
  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}