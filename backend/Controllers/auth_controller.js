const User = require("../Models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const JWT_SECRET = process.env.JWT_SECRET;

// 📧 Mail Transporter (for OTP)
let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});


// ✅ REGISTER — Only creates a normal user (no chatbot)
const register = async (req, res) => {
  try {
    console.log("register request received");

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

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
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


// ✅ LOGIN
const login = async (req, res) => {
  console.log("login request received");
  try {
    const { email, password, otp } = req.body;

    if (!email || (!password && !otp)) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    if (otp) {
      if (user.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      user.otp = "";
      await user.save();
    } else {
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ error: "Invalid Credentials" });
      }
    }

    const data = { user: { id: user.id } };
    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      authtoken,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


// ✅ AUTH USER
const authUser = async (req, res) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send("Please authenticate using a valid token");
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(data.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


// ✅ UPDATE PROFILE
const updateprofile = async (req, res) => {
  try {
    const dbuser = await User.findById(req.user.id);

    if (req.body.newpassword) {
      const passwordCompare = await bcrypt.compare(
        req.body.oldpassword,
        dbuser.password
      );
      if (!passwordCompare) {
        return res.status(400).json({
          error: "Invalid Credentials",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(req.body.newpassword, salt);
      req.body.password = hashedNewPassword;

      delete req.body.oldpassword;
      delete req.body.newpassword;
    }

    await User.findByIdAndUpdate(req.user.id, req.body);
    res.status(200).json({ message: "Profile Updated" });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};


// ✅ SEND OTP
const sendotp = async (req, res) => {
  try {
    console.log("sendotp request received");
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();

    // auto-clear OTP after 5 min
    setTimeout(() => {
      user.otp = "";
      user.save();
    }, 300000);

    let mailDetails = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Login OTP",
      html: `
        <h2>Your OTP for login</h2>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    };

    await mailTransporter.sendMail(mailDetails, (err, data) => {
      if (err) {
        console.log("Error Occurs", err);
        res.status(400).json({ message: "Error sending OTP" });
      } else {
        console.log("Email sent successfully");
        res.status(200).json({ message: "OTP sent successfully" });
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  register,
  login,
  authUser,
  updateprofile,
  sendotp,
};
