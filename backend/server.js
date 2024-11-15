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
    // Get the current server's IP
    const serverIP = Object.values(os.networkInterfaces())
      .flat()
      .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

    console.log(`Current server IP: ${serverIP}`);
    console.log(`Checking server: ${server.name} (${server.ip_address})`);

    // Compare using IP address instead of hostname
    if (server.ip_address === serverIP) {
      console.log(`Checking local server health: ${server.name}`);
      try {
        const response = await fetch(
          `http://localhost:${server.port || 3000}/health`,
          {
            timeout: 5000,
            headers: {
              Accept: "application/json",
            },
          }
        );
        const isOnline = response.ok;
        await handleServerStatus(server, isOnline);
      } catch (error) {
        console.error(`Health check failed for ${server.name}:`, error);
        await handleServerStatus(server, false);
      }
    } else {
      console.log(
        `Skipping health check for remote server: ${server.name} (IP: ${server.ip_address})`
      );
    }
  } catch (error) {
    console.error(`Error checking uptime for ${server.name}:`, error);
    await handleServerStatus(server, false);
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

// Metrics endpoint
app.get("/api/metrics/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Get system information
    const cpuLoad = await si.currentLoad();
    const memoryInfo = await si.mem();
    const diskInfo = await si.fsSize();
    const networkStats = await si.networkStats();
    const mainNetwork = networkStats[0];

    // Get the current server's IP
    const serverIP = Object.values(os.networkInterfaces())
      .flat()
      .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

    // If request is for a different server, proxy it
    if (hostname !== serverIP) {
      try {
        console.log(
          `Forwarding metrics request to: http://${hostname}:3000/api/metrics/local`
        );
        const response = await fetch(
          `http://${hostname}:3000/api/metrics/local`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics from ${hostname}`);
        }
        const data = await response.json();
        return res.json(data);
      } catch (error) {
        console.error(`Error fetching metrics from ${hostname}:`, error);
        // Return local metrics as fallback
        return res.json({
          summary: {
            lastUpdate: new Date().toLocaleString(),
            cpu: {
              current_usage: cpuLoad.currentLoad || 0,
              count: os.cpus().length,
            },
            memory: {
              percent_used: (memoryInfo.used / memoryInfo.total) * 100,
              total_gb: memoryInfo.total / (1024 * 1024 * 1024),
              used_gb: memoryInfo.used / (1024 * 1024 * 1024),
              available_gb: memoryInfo.available / (1024 * 1024 * 1024),
            },
            disk: {
              percent_used: diskInfo[0] ? diskInfo[0].use : 0,
              total_gb: diskInfo[0]
                ? diskInfo[0].size / (1024 * 1024 * 1024)
                : 0,
              used_gb: diskInfo[0]
                ? diskInfo[0].used / (1024 * 1024 * 1024)
                : 0,
              available_gb: diskInfo[0]
                ? diskInfo[0].available / (1024 * 1024 * 1024)
                : 0,
            },
            network: {
              bytes_sent_mb: mainNetwork
                ? mainNetwork.tx_bytes / (1024 * 1024)
                : 0,
              bytes_recv_mb: mainNetwork
                ? mainNetwork.rx_bytes / (1024 * 1024)
                : 0,
              bytes_sent_sec: mainNetwork ? mainNetwork.tx_sec : 0,
              bytes_recv_sec: mainNetwork ? mainNetwork.rx_sec : 0,
            },
          },
        });
      }
    }

    // Return local metrics
    return res.json({
      summary: {
        lastUpdate: new Date().toLocaleString(),
        cpu: {
          current_usage: cpuLoad.currentLoad || 0,
          count: os.cpus().length,
        },
        memory: {
          percent_used: (memoryInfo.used / memoryInfo.total) * 100,
          total_gb: memoryInfo.total / (1024 * 1024 * 1024),
          used_gb: memoryInfo.used / (1024 * 1024 * 1024),
          available_gb: memoryInfo.available / (1024 * 1024 * 1024),
        },
        disk: {
          percent_used: diskInfo[0] ? diskInfo[0].use : 0,
          total_gb: diskInfo[0] ? diskInfo[0].size / (1024 * 1024 * 1024) : 0,
          used_gb: diskInfo[0] ? diskInfo[0].used / (1024 * 1024 * 1024) : 0,
          available_gb: diskInfo[0]
            ? diskInfo[0].available / (1024 * 1024 * 1024)
            : 0,
        },
        network: {
          bytes_sent_mb: mainNetwork ? mainNetwork.tx_bytes / (1024 * 1024) : 0,
          bytes_recv_mb: mainNetwork ? mainNetwork.rx_bytes / (1024 * 1024) : 0,
          bytes_sent_sec: mainNetwork ? mainNetwork.tx_sec : 0,
          bytes_recv_sec: mainNetwork ? mainNetwork.rx_sec : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error getting metrics:", error);
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// Add a local metrics endpoint that doesn't do proxying
app.get("/api/metrics/local", async (req, res) => {
  try {
    // Get current system metrics using systeminformation
    const cpuLoad = await si.currentLoad();
    const memInfo = await si.mem();
    const fsSize = await si.fsSize();
    const networkStats = await si.networkStats();
    const mainNetwork = networkStats[0];

    // Debug log the raw values
    console.log("Raw metrics:", {
      cpu: cpuLoad,
      memory: memInfo,
      disk: fsSize[0],
      network: mainNetwork,
    });

    const realData = {
      summary: {
        lastUpdate: new Date().toISOString(),
        cpu: {
          current_usage: parseFloat(cpuLoad.currentLoad.toFixed(1)), // Round to 1 decimal
          count: os.cpus().length,
        },
        memory: {
          percent_used: parseFloat(
            ((memInfo.active / memInfo.total) * 100).toFixed(1)
          ),
          total_gb: parseFloat(
            (memInfo.total / (1024 * 1024 * 1024)).toFixed(2)
          ),
          used_gb: parseFloat(
            (memInfo.active / (1024 * 1024 * 1024)).toFixed(2)
          ),
          available_gb: parseFloat(
            (memInfo.available / (1024 * 1024 * 1024)).toFixed(2)
          ),
        },
        disk: {
          percent_used: fsSize[0] ? parseFloat(fsSize[0].use.toFixed(1)) : 0,
          total_gb: fsSize[0]
            ? parseFloat((fsSize[0].size / (1024 * 1024 * 1024)).toFixed(2))
            : 0,
          used_gb: fsSize[0]
            ? parseFloat((fsSize[0].used / (1024 * 1024 * 1024)).toFixed(2))
            : 0,
          available_gb: fsSize[0]
            ? parseFloat(
                (fsSize[0].available / (1024 * 1024 * 1024)).toFixed(2)
              )
            : 0,
        },
        network: {
          bytes_sent_mb: parseFloat(
            (mainNetwork.tx_bytes / (1024 * 1024)).toFixed(2)
          ),
          bytes_recv_mb: parseFloat(
            (mainNetwork.rx_bytes / (1024 * 1024)).toFixed(2)
          ),
          bytes_sent_sec: parseFloat(mainNetwork.tx_sec.toFixed(2)),
          bytes_recv_sec: parseFloat(mainNetwork.rx_sec.toFixed(2)),
        },
      },
      details: {
        cpu: {
          cpu_percent: cpuLoad.cpus.map((cpu) =>
            parseFloat(cpu.load.toFixed(1))
          ),
          cpu_count: os.cpus().length,
          cpu_freq_current: os.cpus().map((cpu) => cpu.speed),
          load_1: parseFloat(os.loadavg()[0].toFixed(2)),
          load_5: parseFloat(os.loadavg()[1].toFixed(2)),
          load_15: parseFloat(os.loadavg()[2].toFixed(2)),
        },
        memory: {
          total: memInfo.total,
          used: memInfo.active,
          available: memInfo.available,
          swap_total: memInfo.swaptotal,
          swap_used: memInfo.swapused,
          swap_percent: parseFloat(
            ((memInfo.swapused / memInfo.swaptotal) * 100).toFixed(1)
          ),
        },
      },
    };

    // Debug log the processed metrics
    console.log("Processed metrics:", {
      cpu: realData.summary.cpu.current_usage,
      memory: realData.summary.memory.percent_used,
      disk: realData.summary.disk.percent_used,
      network: {
        in: realData.summary.network.bytes_recv_sec,
        out: realData.summary.network.bytes_sent_sec,
      },
    });

    res.json(realData);
  } catch (error) {
    console.error("Error getting local metrics:", error);
    console.error(error.stack);
    res.status(500).json({
      error: "Failed to get local metrics",
      details: error.message,
      stack: error.stack,
    });
  }
});

// Modify the /api/metrics/:hostname/history endpoint
app.get("/api/metrics/:hostname/history", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Get all IPv4 addresses of the current server
    const localIPs = Object.values(os.networkInterfaces())
      .flat()
      .filter((ip) => ip?.family === "IPv4")
      .map((ip) => ip.address);

    console.log(`Local IPs: ${localIPs.join(", ")}`);
    console.log(`Requested hostname/IP: ${hostname}`);

    // Check if this is a local request
    const isLocalRequest =
      localIPs.includes(hostname) ||
      hostname === "local" ||
      hostname === "localhost";

    if (isLocalRequest) {
      // Handle local request
      const currentMetrics = await si.getDynamicData();
      const cpuTemp = await si.cpuTemperature();
      const memInfo = await si.mem();
      const disks = await diskinfo.getDiskInfo();
      const mainDisk = disks[0];
      const networkStats = await si.networkStats();
      const mainNetwork = networkStats[0];

      // Generate historical data
      const historicalData = Array.from({ length: 288 }, (_, i) => {
        const timestamp = new Date(Date.now() - i * 5 * 60 * 1000);
        const variation = Math.sin(i / 24) * 10;

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

      return res.json(historicalData.reverse());
    } else {
      // Handle remote request
      try {
        const proxyUrl = `http://${hostname}:3000/api/metrics/local/history`;
        console.log(`Attempting to connect to remote server: ${proxyUrl}`);

        const response = await fetch(proxyUrl, {
          timeout: 10000,
          headers: {
            Accept: "application/json",
            "User-Agent": "CoreSight-Monitoring/1.0",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Proxy request failed: ${response.status} - ${errorText}`
          );
          return res.status(502).json({
            error: `Failed to fetch from remote server`,
            details: errorText,
            status: response.status,
          });
        }

        const data = await response.json();
        return res.json(data);
      } catch (error) {
        console.error(`Proxy error details:`, {
          hostname,
          error: error.message,
          stack: error.stack,
          code: error.code,
        });

        return res.status(502).json({
          error: `Cannot connect to server ${hostname}`,
          details: error.message,
          code: error.code || "UNKNOWN_ERROR",
        });
      }
    }
  } catch (error) {
    console.error("Top-level error in historical metrics:", error);
    return res.status(500).json({
      error: "Failed to get historical metrics",
      details: error.message,
    });
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
app.get("/health", async (req, res) => {
  try {
    // Get basic system info
    const cpuLoad = await si.currentLoad();
    const memInfo = await si.mem();

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: os.uptime(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        version: os.version(),
        cpu_usage: cpuLoad.currentLoad,
        memory_usage: (memInfo.used / memInfo.total) * 100,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      error: "Failed to get system health",
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Update the uptime endpoint
app.get("/api/metrics/:hostname/uptime", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Get all IPv4 addresses of the current server
    const localIPs = Object.values(os.networkInterfaces())
      .flat()
      .filter((ip) => ip?.family === "IPv4")
      .map((ip) => ip.address);

    console.log(`Checking uptime for ${hostname}`);
    console.log(`Local IPs: ${localIPs.join(", ")}`);

    // Check if this is a local request
    const isLocalRequest =
      localIPs.includes(hostname) ||
      hostname === "local" ||
      hostname === "localhost";

    if (isLocalRequest) {
      // Get system uptime and load
      const uptime = os.uptime();
      const cpuLoad = await si.currentLoad();
      const startTime = new Date(Date.now() - uptime * 1000);

      console.log("Local uptime data:", {
        uptime,
        startTime: startTime.toISOString(),
      });

      res.json({
        status: "online",
        uptime: Math.floor(uptime),
        start_time: startTime.toISOString(),
        last_checked: new Date().toISOString(),
        last_downtime: null,
        system_info: {
          platform: os.platform(),
          cpu_load: cpuLoad.currentLoad,
          memory_used: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        },
      });
    } else {
      // Forward request to remote server
      try {
        const response = await fetch(
          `http://${hostname}:3000/api/metrics/local/uptime`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch uptime from ${hostname}`);
        }
        const data = await response.json();
        res.json(data);
      } catch (error) {
        console.error(`Error fetching uptime from ${hostname}:`, error);
        res.status(503).json({
          status: "offline",
          uptime: 0,
          last_checked: new Date().toISOString(),
          last_downtime: new Date().toISOString(),
          error: `Failed to connect to ${hostname}`,
        });
      }
    }
  } catch (error) {
    console.error("Error getting uptime:", error);
    res.status(500).json({
      error: "Failed to get uptime",
      details: error.message,
    });
  }
});

// Update the local uptime endpoint
app.get("/api/metrics/local/uptime", async (req, res) => {
  try {
    const uptime = os.uptime();
    const cpuLoad = await si.currentLoad();
    const startTime = new Date(Date.now() - uptime * 1000);

    res.json({
      status: "online",
      uptime: Math.floor(uptime),
      start_time: startTime.toISOString(),
      last_checked: new Date().toISOString(),
      last_downtime: null,
      system_info: {
        platform: os.platform(),
        cpu_load: cpuLoad.currentLoad,
        memory_used: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
    });
  } catch (error) {
    console.error("Error getting local uptime:", error);
    res.status(500).json({
      error: "Failed to get local uptime",
      details: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
