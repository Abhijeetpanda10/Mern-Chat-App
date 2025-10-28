require("dotenv").config();
const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./socket/index.js");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup (fixed for Netlify + Render)
const allowedOrigins = [
  "https://aquamarine-axolotl-a57d6e.netlify.app/",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Explicitly handle preflight requests
app.options("*", cors());

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
