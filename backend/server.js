const express = require("express");
const cors = require("cors");

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

// Metrics history endpoint with mock data
app.get("/api/metrics/history/:hostname", (req, res) => {
  const { hostname } = req.params;
  console.log(`Fetching metrics history for hostname: ${hostname}`);

  // Generate mock data
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

// Health endpoint with mock data
app.get("/api/health/:hostname", (req, res) => {
  const { hostname } = req.params;
  console.log(`Fetching health for hostname: ${hostname}`);

  const mockHealth = {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    disk_usage: Math.random() * 100,
    network_in: Math.floor(Math.random() * 1000000),
    network_out: Math.floor(Math.random() * 1000000),
    status: "online",
  };

  res.json(mockHealth);
});

// Metrics endpoint
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

// Start server with error handling
const server = app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed. Exiting process...");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed. Exiting process...");
    process.exit(0);
  });
});
