const express = require("express");
const cors = require("cors");
const os = require("os");
const { exec } = require("child_process");
const fs = require("fs").promises;

const app = express();

// Store metrics in memory (temporary solution)
let latestMetrics = {};
const metricsHistory = [];
const MAX_HISTORY = 288; // 24 hours of 5-minute intervals

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Get current metrics for a specific server
app.get("/api/metrics/:hostname", (req, res) => {
  const { hostname } = req.params;

  if (!latestMetrics[hostname]) {
    return res
      .status(404)
      .json({ error: "No metrics available for this server" });
  }

  res.json(latestMetrics[hostname]);
});

// Get metrics history
app.get("/api/metrics/history/:hostname", (req, res) => {
  const { hostname } = req.params;
  console.log(`Fetching metrics history for hostname: ${hostname}`);

  // Filter history for specific hostname
  const serverHistory = metricsHistory
    .filter((metric) => metric.hostname === hostname)
    .map((metric) => ({
      timestamp: metric.timestamp,
      cpu_usage: metric.cpu.usage,
      memory_usage: metric.memory.percentage,
      disk_usage: metric.disk.percentage,
      network_in: metric.network.rx_bytes,
      network_out: metric.network.tx_bytes,
    }));

  res.json(serverHistory);
});

// Receive metrics from agent
app.post("/api/metrics", (req, res) => {
  const metrics = req.body;
  const hostname = metrics.hostname;

  // Add timestamp if not present
  metrics.timestamp = metrics.timestamp || new Date().toISOString();

  // Update latest metrics
  latestMetrics[hostname] = metrics;

  // Add to history
  metricsHistory.unshift(metrics);

  // Keep only last 24 hours of data
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.pop();
  }

  console.log("Received metrics from:", hostname);
  res.json({ status: "ok" });
});

// Health check endpoint
app.get("/api/health-check", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all servers status
app.get("/api/servers/status", (req, res) => {
  const servers = Object.keys(latestMetrics).map((hostname) => ({
    hostname,
    lastUpdate: latestMetrics[hostname].timestamp,
    status: isServerActive(latestMetrics[hostname].timestamp)
      ? "active"
      : "inactive",
  }));

  res.json(servers);
});

// Helper function to check if server is active
function isServerActive(timestamp) {
  const lastUpdate = new Date(timestamp);
  const now = new Date();
  return now - lastUpdate < 5 * 60 * 1000; // 5 minutes threshold
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
