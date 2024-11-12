const express = require("express");
const cors = require("cors");
const os = require("os");
const { exec } = require("child_process");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/health-check", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get server metrics
app.get("/api/metrics/:hostname", async (req, res) => {
  try {
    const metrics = {
      cpu: {
        usage: (os.loadavg()[0] * 100) / os.cpus().length,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      uptime: os.uptime(),
      timestamp: new Date().toISOString(),
    };

    // Get disk usage using df command
    exec("df -h /", (error, stdout, stderr) => {
      if (!error) {
        const lines = stdout.trim().split("\n");
        const diskInfo = lines[1].split(/\s+/);
        metrics.disk = {
          total: diskInfo[1],
          used: diskInfo[2],
          free: diskInfo[3],
          percentage: parseInt(diskInfo[4]),
        };
      }

      res.json(metrics);
    });
  } catch (error) {
    console.error("Error getting metrics:", error);
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// Get metrics history
app.get("/api/metrics/history/:hostname", (req, res) => {
  const { hostname } = req.params;
  console.log(`Fetching metrics history for hostname: ${hostname}`);

  // Generate mock historical data
  const mockData = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    disk_usage: Math.random() * 100,
    network_in: Math.floor(Math.random() * 1000000),
    network_out: Math.floor(Math.random() * 1000000),
  }));

  res.json(mockData);
});

// Receive metrics from agent
app.post("/api/metrics", (req, res) => {
  console.log("Received metrics:", req.body);
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
