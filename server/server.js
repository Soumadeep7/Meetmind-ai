const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const actionItemRoutes = require("./routes/actionItemRoutes");
const aiRoutes = require("./routes/aiRoutes");
const transcriptionRoutes = require("./routes/transcriptionRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ==============================
// Database
// ==============================

connectDB();

// ==============================
// Middleware
// ==============================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ==============================
// API Routes
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/action-items", actionItemRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/users", userRoutes);

// ==============================
// Health Routes
// ==============================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MeetMind AI Backend is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MeetMind AI API is healthy",
  });
});

// ==============================
// Start Server
// ==============================

app.listen(PORT, "0.0.0.0", () => {
  console.log("----------------------------------");
  console.log("MeetMind AI Backend");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("----------------------------------");
});