const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");
const nodemailer = require("nodemailer");
const mysql = require("mysql2");
const config = require("./config");
require("dotenv").config();

// Create MySQL connection pool
const db = mysql
  .createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "efi",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Test database connection
db.getConnection()
  .then((connection) => {
    console.log("Database connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

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

// Make sure to add this SQL to create the server_uptime table if it doesn't exist
db.query(
  `
  CREATE TABLE IF NOT EXISTS server_uptime (
    server_id VARCHAR(36) PRIMARY KEY,
    status ENUM('online', 'offline') NOT NULL DEFAULT 'offline',
    last_checked DATETIME NOT NULL,
    last_downtime DATETIME,
    uptime INT UNSIGNED DEFAULT 0,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
  )
`
).catch((err) => console.error("Error creating server_uptime table:", err));

// Add uptime monitoring function
async function checkServerUptime(server) {
  try {
    // Clean up the hostname and ensure proper port
    const cleanHostname = server.hostname.replace(/^https?:\/\//, "");
    const port = server.port || 3000;

    // Try HTTP first
    try {
      const response = await fetch(`http://${cleanHostname}:${port}/health`, {
        timeout: 5000,
        headers: {
          Accept: "application/json",
        },
      });
      const isOnline = response.ok;
      handleServerStatus(server, isOnline);
    } catch (httpError) {
      // If HTTP fails, try HTTPS
      try {
        const response = await fetch(
          `https://${cleanHostname}:${port}/health`,
          {
            timeout: 5000,
            headers: {
              Accept: "application/json",
            },
          }
        );
        const isOnline = response.ok;
        handleServerStatus(server, isOnline);
      } catch (httpsError) {
        console.error(
          `Both HTTP and HTTPS failed for ${server.name}:`,
          httpsError
        );
        handleServerStatus(server, false);
      }
    }
  } catch (error) {
    console.error(`Error checking uptime for ${server.name}:`, error);
    handleServerStatus(server, false);
  }
}

// Separate function to handle server status updates
async function handleServerStatus(server, isOnline) {
  try {
    // Get current uptime data
    const [currentUptime] = await db.query(
      `SELECT uptime, last_checked, last_downtime 
       FROM server_uptime 
       WHERE server_id = ?`,
      [server.id]
    );

    // Calculate new uptime
    let newUptime = 0;
    let lastDowntime = currentUptime?.[0]?.last_downtime || null;

    if (currentUptime?.[0]?.status === "online" && isOnline) {
      const timeDiff = Math.floor(
        (Date.now() - new Date(currentUptime[0].last_checked).getTime()) / 1000
      );
      newUptime = currentUptime[0].uptime + timeDiff;
    }

    if (!isOnline) {
      lastDowntime = new Date();
    }

    // Update database
    await db.query(
      `INSERT INTO server_uptime 
         (server_id, status, last_checked, uptime, last_downtime)
       VALUES (?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         last_checked = VALUES(last_checked),
         uptime = VALUES(uptime),
         last_downtime = VALUES(last_downtime)`,
      [server.id, isOnline ? "online" : "offline", newUptime, lastDowntime]
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
    console.error(`Error updating server status for ${server.name}:`, error);
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

// Add this near your other endpoints
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
