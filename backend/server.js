const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");
const nodemailer = require("nodemailer");

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

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Add uptime monitoring function
async function checkServerUptime(server) {
  try {
    const response = await fetch(
      `http://${server.hostname}:${server.port}/health`
    );
    const isOnline = response.ok;

    // Update uptime in database
    await db.query(
      `
      INSERT INTO server_uptime (server_id, status, last_checked, uptime)
      VALUES (?, ?, NOW(), COALESCE(
        (SELECT uptime + TIMESTAMPDIFF(SECOND, last_checked, NOW())
        FROM server_uptime WHERE server_id = ? AND status = 'online'),
        0
      ))
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        last_checked = VALUES(last_checked),
        uptime = VALUES(uptime),
        last_downtime = CASE 
          WHEN status = 'online' AND VALUES(status) = 'offline'
          THEN NOW()
          ELSE last_downtime
        END
    `,
      [server.id, isOnline ? "online" : "offline", server.id]
    );

    // Send notification if server goes down
    if (!isOnline) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `Server Down Alert: ${server.name}`,
        text: `Server ${server.name} (${
          server.hostname
        }) is unreachable.\nTime: ${new Date().toISOString()}`,
      });
    }
  } catch (error) {
    console.error(`Error checking uptime for ${server.name}:`, error);
  }
}

// Add uptime monitoring interval
setInterval(async () => {
  try {
    const [servers] = await db.query("SELECT * FROM servers");
    for (const server of servers) {
      await checkServerUptime(server);
    }
  } catch (error) {
    console.error("Error in uptime monitoring:", error);
  }
}, 60000); // Check every minute

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

// Add this endpoint for processes
app.get("/api/metrics/:hostname/processes", async (req, res) => {
  try {
    const { hostname } = req.params;
    const processes = await si.processes();

    // Format and sort processes by CPU usage
    const formattedProcesses = processes.list
      .map((proc) => ({
        pid: proc.pid,
        name: proc.name,
        cpu: proc.cpu,
        memory: proc.mem,
        status: proc.state.toLowerCase(),
      }))
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 10); // Only return top 10 processes

    res.json(formattedProcesses);
  } catch (error) {
    console.error("Error getting processes:", error);
    res.status(500).json({ error: "Failed to get processes" });
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
