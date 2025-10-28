require("dotenv").config();
const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./socket/index.js"); // ✅ Correct import

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "https://aquamarine-axolotl-a57d6e.netlify.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

// ✅ Routes
app.get("/", (req, res) => {
  res.send("✅ Chat server is running successfully!");
});
app.use("/auth", require("./Routes/auth_routes.js"));
app.use("/user", require("./Routes/userRoutes.js"));
app.use("/message", require("./Routes/message_routes.js"));
app.use("/conversation", require("./Routes/conversation_routes.js"));

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Initialize socket.io
initSocket(server);

// ✅ Start server and connect database
server.listen(PORT, async () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
  await connectDB();
});
