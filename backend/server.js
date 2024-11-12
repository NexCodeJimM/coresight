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

// Get detailed system metrics
async function getDetailedSystemMetrics() {
  return new Promise((resolve, reject) => {
    exec("vmstat 1 2 | tail -1", (error, stdout, stderr) => {
      if (error) {
        console.error("Error getting vmstat:", error);
        return reject(error);
      }

      const vmstat = stdout.trim().split(/\s+/);

      // Get disk I/O stats
      exec("iostat -x 1 2 | grep sda", (error, stdout, stderr) => {
        const iostat = error ? null : stdout.trim().split(/\s+/);

        // Get network stats
        exec("netstat -i | grep eth0", (error, stdout, stderr) => {
          const netstat = error ? null : stdout.trim().split(/\s+/);

          // Get process stats
          exec("ps aux | head -n 5", (error, stdout, stderr) => {
            const processes = error
              ? []
              : stdout
                  .trim()
                  .split("\n")
                  .slice(1)
                  .map((line) => {
                    const parts = line.trim().split(/\s+/);
                    return {
                      user: parts[0],
                      pid: parts[1],
                      cpu: parseFloat(parts[2]),
                      mem: parseFloat(parts[3]),
                      command: parts[10],
                    };
                  });

            const metrics = {
              system: {
                hostname: os.hostname(),
                platform: os.platform(),
                release: os.release(),
                uptime: os.uptime(),
                loadavg: os.loadavg(),
                totalmem: os.totalmem(),
                freemem: os.freemem(),
              },
              cpu: {
                model: os.cpus()[0].model,
                cores: os.cpus().length,
                speed: os.cpus()[0].speed,
                usage: vmstat
                  ? {
                      user: parseInt(vmstat[12]),
                      system: parseInt(vmstat[13]),
                      idle: parseInt(vmstat[14]),
                      iowait: parseInt(vmstat[15]),
                    }
                  : null,
              },
              memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                percentage:
                  ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
                swap: vmstat
                  ? {
                      total: parseInt(vmstat[2]),
                      used: parseInt(vmstat[3]),
                    }
                  : null,
              },
              disk: {
                io: iostat
                  ? {
                      reads_per_sec: parseFloat(iostat[3]),
                      writes_per_sec: parseFloat(iostat[4]),
                      read_bytes_per_sec: parseFloat(iostat[5]),
                      write_bytes_per_sec: parseFloat(iostat[6]),
                      util_percentage: parseFloat(iostat[iostat.length - 1]),
                    }
                  : null,
              },
              network: {
                interfaces: Object.entries(os.networkInterfaces()).map(
                  ([name, data]) => ({
                    name,
                    addresses: data.map((addr) => ({
                      address: addr.address,
                      family: addr.family,
                      internal: addr.internal,
                    })),
                  })
                ),
                stats: netstat
                  ? {
                      rx_packets: parseInt(netstat[3]),
                      tx_packets: parseInt(netstat[7]),
                      rx_bytes: parseInt(netstat[5]),
                      tx_bytes: parseInt(netstat[9]),
                    }
                  : null,
              },
              processes: {
                total: processes.length,
                top: processes,
              },
            };

            resolve(metrics);
          });
        });
      });
    });
  });
}

// Get current metrics for a specific server
app.get("/api/metrics/:hostname", async (req, res) => {
  const { hostname } = req.params;

  try {
    if (!latestMetrics[hostname]) {
      const systemMetrics = await getDetailedSystemMetrics();
      latestMetrics[hostname] = {
        ...systemMetrics,
        timestamp: new Date().toISOString(),
      };
    }

    res.json(latestMetrics[hostname]);
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
