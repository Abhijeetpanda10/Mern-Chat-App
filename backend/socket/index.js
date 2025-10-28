require('dotenv').config();
const { Server } = require("socket.io");
const registerHandlers = require("./handlers");

let io;

const initSocket = (server) => {
  io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000" , "https://aquamarine-axolotl-a57d6e.netlify.app" ],
    methods: ["GET", "POST"],
    credentials: true,
  },transports: ["websocket", "polling"]
});
  console.log("Socket.io initialized");

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);
    registerHandlers(io, socket);
  });

  return io;
};

module.exports = { initSocket };
