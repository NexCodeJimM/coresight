const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
require("dotenv").config();

const app = express();
app.use(cors());

// Keep track of previous network stats for calculating rate
let previousNetworkStats = null;
let previousTimestamp = Date.now();

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Get system information
    const [cpu, mem, disk, networkStats, processes] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.processes(),
    ]);

    // Calculate network usage rate
    const currentTimestamp = Date.now();
    let networkUsage = 0;

    if (previousNetworkStats && networkStats[0]) {
      const timeDiff = (currentTimestamp - previousTimestamp) / 1000; // Convert to seconds
      const bytesIn = networkStats[0].rx_bytes - previousNetworkStats.rx_bytes;
      const bytesOut = networkStats[0].tx_bytes - previousNetworkStats.tx_bytes;
      const totalBytes = bytesIn + bytesOut;

      // Convert to MB/s
      networkUsage = totalBytes / timeDiff / (1024 * 1024);
    }

    // Update previous stats
    if (networkStats[0]) {
      previousNetworkStats = {
        rx_bytes: networkStats[0].rx_bytes,
        tx_bytes: networkStats[0].tx_bytes,
      };
      previousTimestamp = currentTimestamp;
    }

    // Calculate metrics
    const metrics = {
      status: "online",
      uptime: os.uptime(),
      cpu: {
        usage: cpu.currentLoad,
        cores: os.cpus().length,
      },
      memory: {
        total: mem.total,
        used: mem.used,
        usage: (mem.used / mem.total) * 100,
      },
      disk: {
        total: disk[0].size,
        used: disk[0].used,
        usage: (disk[0].used / disk[0].size) * 100,
      },
      network: {
        usage: networkUsage,
        interfaces: networkStats.map((net) => ({
          interface: net.iface,
          rx_bytes: net.rx_bytes,
          tx_bytes: net.tx_bytes,
          rx_sec: net.rx_sec,
          tx_sec: net.tx_sec,
        })),
      },
      processes: processes.list
        .map((proc) => ({
          pid: proc.pid,
          name: proc.name,
          cpu_usage: proc.cpu,
          memory_usage: (proc.mem / mem.total) * 100,
        }))
        .slice(0, 50), // Top 50 processes
      timestamp: new Date(),
    };

    res.json(metrics);
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
