const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Shree Ji API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
