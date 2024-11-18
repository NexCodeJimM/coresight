const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");

const app = express();
app.use(cors());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Get system information
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

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

// Start server
const PORT = process.env.HEALTH_PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Health check server running on port ${PORT}`);
});
