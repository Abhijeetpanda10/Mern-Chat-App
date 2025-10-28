const User = require("../Models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key"; // fallback key

// ✅ Configure email (optional)
let mailTransporter = null;
if (process.env.EMAIL && process.env.PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
} else {
  console.warn("⚠️ EMAIL or PASSWORD missing in .env — OTP feature disabled");
}

// ✅ REGISTER USER
const register = async (req, res) => {
  try {
    console.log("➡️ REGISTER request received");

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Please fill all the fields" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const imageUrl = `https://ui-avatars.com/api/?name=${name}&background=random&bold=true`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      profilePic: imageUrl,
      about: "Hello World!!",
    });

    await newUser.save();

    const data = { user: { id: newUser.id } };
    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      authtoken,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ LOGIN USER
const login = async (req, res) => {
  console.log("➡️ LOGIN request received");
  try {
    const { email, password, otp } = req.body;
    if (!email || (!password && !otp))
      return res.status(400).json({ error: "Please fill all the fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid Credentials" });

    // ✅ OTP login
    if (otp) {
      if (user.otp !== otp)
        return res.status(400).json({ error: "Invalid OTP" });

      user.otp = "";
      await user.save();
    } else {
      // ✅ Password login
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare)
        return res.status(400).json({ error: "Invalid Credentials" });
    }

    const data = { user: { id: user.id } };
    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      authtoken,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ AUTH USER BY TOKEN
const authUser = async (req, res) => {
  const token = req.header("auth-token");
  if (!token)
    return res
      .status(401)
      .json({ error: "Please authenticate using a valid token" });

  try {
    const data = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(data.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("AUTH ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ UPDATE PROFILE
const updateprofile = async (req, res) => {
  try {
    const dbuser = await User.findById(req.user.id);
    if (!dbuser) return res.status(404).json({ error: "User not found" });

    if (req.body.newpassword) {
      const passwordCompare = await bcrypt.compare(
        req.body.oldpassword,
        dbuser.password
      );
      if (!passwordCompare)
        return res.status(400).json({ error: "Invalid Credentials" });

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(req.body.newpassword, salt);
      req.body.password = hashedNewPassword;

      delete req.body.oldpassword;
      delete req.body.newpassword;
    }

    await User.findByIdAndUpdate(req.user.id, req.body);
    res.status(200).json({ message: "Profile Updated" });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ SEND OTP (for login/forgot password)
const sendotp = async (req, res) => {
  try {
    console.log("➡️ SEND OTP request received");
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!mailTransporter)
      return res
        .status(503)
        .json({ error: "Email service not configured. OTP cannot be sent." });

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();

    // Auto-clear OTP after 5 min
    setTimeout(async () => {
      user.otp = "";
      await user.save();
    }, 300000);

    const mailDetails = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Login OTP",
      html: `
        <h2>Your OTP for login</h2>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    };

    await mailTransporter.sendMail(mailDetails);
    console.log(`📩 OTP sent to ${email}: ${otp}`);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ ADD THIS (Non-friends list)
const getNonFriendsList = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("GET NON FRIENDS ERROR:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ EXPORT EVERYTHING
module.exports = {
  register,
  login,
  authUser,
  updateprofile,
  sendotp,
  getNonFriendsList,
};
