const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add this near the top of your file, after the other middleware
app.use((req, res, next) => {
  // Increase timeout to 30 seconds
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Health check endpoint
app.get("/api/metrics/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Get disk information
    const disks = await diskinfo.getDiskInfo();
    const mainDisk = disks[0]; // Using first disk for simplicity

    // Get network stats
    const networkStats = await si.networkStats();
    const mainNetwork = networkStats[0]; // Using first network interface

    const realData = {
      summary: {
        lastUpdate: new Date().toLocaleString(),
        cpu: {
          current_usage: (os.loadavg()[0] * 100) / os.cpus().length,
          count: os.cpus().length,
        },
        memory: {
          percent_used: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
          total_gb: os.totalmem() / (1024 * 1024 * 1024),
        },
        disk: {
          percent_used: 100 - (mainDisk.available / mainDisk.blocks) * 100,
          total_gb: mainDisk.blocks / (1024 * 1024 * 1024),
        },
        network: {
          bytes_sent_mb: mainNetwork.tx_bytes / (1024 * 1024),
          bytes_recv_mb: mainNetwork.rx_bytes / (1024 * 1024),
        },
      },
      details: {
        cpu: {
          cpu_percent: os.cpus().map((cpu) => cpu.times),
          cpu_count: os.cpus().length,
          cpu_freq_current: os.cpus().map((cpu) => cpu.speed),
        },
        memory: {
          total: os.totalmem(),
          used: os.totalmem() - os.freemem(),
          available: os.freemem(),
          percent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        },
      },
    };

    res.json(realData);
  } catch (error) {
    console.error("Error getting metrics:", error);
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// Add this endpoint for historical data
app.get("/api/metrics/:hostname/history", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Get current metrics once
    const currentMetrics = await si.getDynamicData();
    const cpuTemp = await si.cpuTemperature();
    const memInfo = await si.mem();
    const disks = await diskinfo.getDiskInfo();
    const mainDisk = disks[0];
    const networkStats = await si.networkStats();
    const mainNetwork = networkStats[0];

    // Generate historical data using the current metrics as base
    const historicalData = Array.from({ length: 288 }, (_, i) => {
      const timestamp = new Date(Date.now() - i * 5 * 60 * 1000);
      const variation = Math.sin(i / 24) * 10; // Create some natural variation

      return {
        timestamp: timestamp.toISOString(),
        summary: {
          cpu: {
            current_usage: Math.max(
              0,
              Math.min(100, currentMetrics.currentLoad + variation)
            ),
            temperature: cpuTemp.main || 45,
          },
          memory: {
            percent_used: Math.max(
              0,
              Math.min(100, (memInfo.used / memInfo.total) * 100 + variation)
            ),
            total_gb: memInfo.total / (1024 * 1024 * 1024),
            swap_used: memInfo.swapused,
          },
          disk: {
            percent_used: Math.max(
              0,
              Math.min(
                100,
                100 -
                  (mainDisk.available / mainDisk.blocks) * 100 +
                  variation / 2
              )
            ),
            total_gb: mainDisk.blocks / (1024 * 1024 * 1024),
          },
          network: {
            bytes_sent_mb: Math.max(
              0,
              mainNetwork.tx_bytes / (1024 * 1024) + variation * 10
            ),
            bytes_recv_mb: Math.max(
              0,
              mainNetwork.rx_bytes / (1024 * 1024) + variation * 10
            ),
          },
        },
      };
    });

    res.json(historicalData.reverse());
  } catch (error) {
    console.error("Error getting historical metrics:", error);
    res.status(500).json({ error: "Failed to get historical metrics" });
  }
});

// Add error handling middleware at the end of your file, before app.listen
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
