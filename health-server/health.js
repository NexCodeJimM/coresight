const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
require("dotenv").config();

const app = express();
app.use(cors());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // ... rest of the code remains the same ...
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Use environment variable for port
const PORT = process.env.HEALTH_PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Health check server running on port ${PORT}`);
});
