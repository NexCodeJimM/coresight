const express = require("express");
const cors = require("cors");
const os = require("os");

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/metrics/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Generate mock data for testing
    const mockData = {
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
          percent_used: 50, // Mock value
          total_gb: 500, // Mock value
        },
        network: {
          bytes_sent_mb: 100, // Mock value
          bytes_recv_mb: 100, // Mock value
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

    res.json(mockData);
  } catch (error) {
    console.error("Error getting metrics:", error);
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// Add this endpoint for historical data
app.get("/api/metrics/:hostname/history", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Generate mock historical data for the last 24 hours
    const historicalData = Array.from({ length: 288 }, (_, i) => {
      const timestamp = new Date(Date.now() - i * 5 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        summary: {
          cpu: {
            current_usage: Math.random() * 100,
            temperature: 40 + Math.random() * 20,
          },
          memory: {
            percent_used: Math.random() * 100,
            total_gb: os.totalmem() / (1024 * 1024 * 1024),
            swap_used: Math.random() * 1024 * 1024 * 1024,
          },
          disk: {
            percent_used: Math.random() * 100,
            total_gb: 500,
          },
          network: {
            bytes_sent_mb: Math.random() * 1000,
            bytes_recv_mb: Math.random() * 1000,
          },
        },
      };
    }).reverse();

    res.json(historicalData);
  } catch (error) {
    console.error("Error getting historical metrics:", error);
    res.status(500).json({ error: "Failed to get historical metrics" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
