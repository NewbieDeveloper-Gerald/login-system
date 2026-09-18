const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedURL = process.env.FRONTEND_URL;

    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // If no FRONTEND_URL is set, allow all origins
    if (!allowedURL) return callback(null, true);

    // Allow if origin matches exactly OR if it's a Vercel preview URL
    // Vercel generates: project-name.vercel.app, project-name-git-branch-user.vercel.app, etc.
    if (origin === allowedURL || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // Also allow localhost for development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// Routes
// Health check
app.get("/", (req, res) => {
  res.json({ message: "Login API is running.", timestamp: new Date() });
});

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword
    });

    res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Protected Profile Route
app.get("/api/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      message: "Protected data.",
      user: {
        name: decoded.name,
        email: decoded.email
      }
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
});

// Start Server & Connect DB
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected.");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });
