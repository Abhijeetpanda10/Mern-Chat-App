// Middleware/fetchuser.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

const fetchuser = (req, res, next) => {
  const token = req.header("auth-token"); // token comes from frontend

  if (!token) {
    return res
      .status(401)
      .json({ error: "Please authenticate using a valid token" });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = fetchuser;
