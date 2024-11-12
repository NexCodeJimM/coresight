const express = require("express");
const cors = require("cors");
const os = require("os");
const { exec } = require("child_process");
const fs = require("fs").promises;
const si = require("systeminformation");

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

// Enhanced system metrics function
async function getDetailedSystemMetrics() {
  try {
    const [cpu, mem, disk, network, processes] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.processes(),
    ]);

    // Get CPU temperature if available
    let cpuTemp;
    try {
      cpuTemp = await si.cpuTemperature();
    } catch (e) {
      cpuTemp = { main: 0, cores: [], max: 0 };
    }

    // Get detailed CPU load per core
    const cpuLoad = await si.currentLoad();

    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: {
          total: cpuLoad.currentLoad,
          user: cpuLoad.currentLoadUser,
          system: cpuLoad.currentLoadSystem,
          idle: cpuLoad.currentLoadIdle,
        },
        cores: cpuLoad.cpus.map((core, index) => ({
          number: index + 1,
          load: core.load,
          loadUser: core.loadUser,
          loadSystem: core.loadSystem,
        })),
        temperature: {
          main: cpuTemp.main,
          cores: cpuTemp.cores,
          max: cpuTemp.max,
        },
        info: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          speed: cpu.speed,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
        },
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        active: mem.active,
        available: mem.available,
        swap: {
          total: mem.swaptotal,
          used: mem.swapused,
          free: mem.swapfree,
        },
        percentage: (mem.used / mem.total) * 100,
      },
      disk: {
        volumes: disk.map((volume) => ({
          fs: volume.fs,
          type: volume.type,
          size: volume.size,
          used: volume.used,
          available: volume.available,
          mount: volume.mount,
          percentage: (volume.used / volume.size) * 100,
        })),
        io: {
          total: disk.reduce((acc, curr) => acc + curr.size, 0),
          used: disk.reduce((acc, curr) => acc + curr.used, 0),
          available: disk.reduce((acc, curr) => acc + curr.available, 0),
        },
      },
      network: {
        interfaces: network.map((iface) => ({
          interface: iface.iface,
          rx_bytes: iface.rx_bytes,
          tx_bytes: iface.tx_bytes,
          rx_sec: iface.rx_sec,
          tx_sec: iface.tx_sec,
          rx_dropped: iface.rx_dropped,
          tx_dropped: iface.tx_dropped,
          rx_errors: iface.rx_errors,
          tx_errors: iface.tx_errors,
        })),
      },
      processes: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
        top: processes.list.slice(0, 10).map((proc) => ({
          pid: proc.pid,
          name: proc.name,
          cpu: proc.cpu,
          mem: proc.mem,
          command: proc.command,
        })),
      },
    };
  } catch (error) {
    console.error("Error getting detailed metrics:", error);
    throw error;
  }
}

// Get current metrics for a specific server
app.get("/api/metrics/:hostname", async (req, res) => {
  const { hostname } = req.params;

  try {
    const metrics = await getDetailedSystemMetrics();
    latestMetrics[hostname] = metrics;
    res.json(metrics);
  } catch (error) {
    console.error("Error getting metrics:", error);
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// Get metrics history
app.get("/api/metrics/history/:hostname", (req, res) => {
  const { hostname } = req.params;
  console.log(`Fetching metrics history for hostname: ${hostname}`);

  // Generate 24 hours of data points (one every 5 minutes)
  const dataPoints = Array.from({ length: 288 }, (_, index) => {
    const timestamp = new Date(Date.now() - index * 5 * 60 * 1000);
    const metrics = latestMetrics[hostname] || {};

    return {
      timestamp: timestamp.toISOString(),
      cpu_usage: metrics.cpu?.usage?.user || Math.random() * 100,
      memory_usage: metrics.memory?.percentage || Math.random() * 100,
      disk_usage: metrics.disk?.io?.util_percentage || Math.random() * 100,
      network_in:
        metrics.network?.stats?.rx_bytes || Math.floor(Math.random() * 1000000),
      network_out:
        metrics.network?.stats?.tx_bytes || Math.floor(Math.random() * 1000000),
    };
  }).reverse(); // Reverse to get chronological order

  // Store in history
  if (dataPoints.length > 0) {
    metricsHistory.push(...dataPoints);
    // Keep only last 24 hours
    while (metricsHistory.length > MAX_HISTORY) {
      metricsHistory.shift();
    }
  }

  res.json(dataPoints);
});

// Receive metrics from agent
app.post("/api/metrics", async (req, res) => {
  const metrics = req.body;
  const hostname = metrics.hostname;

  try {
    // Enhance received metrics with detailed system info
    const systemMetrics = await getDetailedSystemMetrics();
    const enhancedMetrics = {
      ...metrics,
      ...systemMetrics,
      timestamp: new Date().toISOString(),
    };

    // Update latest metrics
    latestMetrics[hostname] = enhancedMetrics;

    // Add to history with proper format
    const historyEntry = {
      timestamp: enhancedMetrics.timestamp,
      cpu_usage:
        enhancedMetrics.cpu.usage.user + enhancedMetrics.cpu.usage.system,
      memory_usage: enhancedMetrics.memory.percentage,
      disk_usage: enhancedMetrics.disk.io?.util_percentage || 0,
      network_in: enhancedMetrics.network.stats?.rx_bytes || 0,
      network_out: enhancedMetrics.network.stats?.tx_bytes || 0,
    };

    metricsHistory.push(historyEntry);

    // Keep only last 24 hours
    while (metricsHistory.length > MAX_HISTORY) {
      metricsHistory.shift();
    }

    console.log("Received and enhanced metrics from:", hostname);
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error processing metrics:", error);
    res.status(500).json({ error: "Failed to process metrics" });
  }
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
