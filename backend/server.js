const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");
const nodemailer = require("nodemailer");
const mysql = require("mysql2");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const fetch = require("node-fetch");

const app = express();

// Add this near the top of your file, after loading dotenv
console.log("Environment variables loaded:", {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  PORT: process.env.PORT,
});

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://143.198.84.214:3000",
    "http://143.198.84.214:3036",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
};

// Enable pre-flight requests for all routes
app.options("*", cors(corsOptions));

// Enable CORS for all routes
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Your existing database connection setup...
const db = mysql
  .createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Add debug logging for database connection
db.getConnection()
  .then((connection) => {
    console.log("Successfully connected to database:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
    });
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to database:", {
      error: err.message,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
    });
  });

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  next();
});

// Timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Add this near the top of your file, after other middleware
app.use((req, res, next) => {
  if (req.method === "POST") {
    console.log("Request body:", {
      ...req.body,
      token: req.body.token ? "***" : "not set",
    });
  }
  next();
});

// Server routes
app.put("/api/servers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      hostname,
      ip_address,
      port,
      org,
      bucket,
      token,
    } = req.body;

    console.log("Received update request:", { id, ...req.body });

    // Update server in MySQL
    const [result] = await db.query(
      `UPDATE servers 
       SET name = ?, 
           description = ?,
           hostname = ?,
           ip_address = ?,
           port = ?,
           org = ?,
           bucket = ?,
           token = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        description || null,
        hostname,
        ip_address,
        port,
        org,
        bucket,
        token,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    // Fetch updated server data
    const [servers] = await db.query(
      `SELECT id, name, description, hostname, ip_address, port, org, bucket, token, status
       FROM servers WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Server settings updated successfully",
      server: servers[0],
    });
  } catch (error) {
    console.error("Error updating server:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update server configuration",
      details: error.message,
    });
  }
});

// Update the POST endpoint for creating new servers
app.post("/api/servers", async (req, res) => {
  try {
    console.log("Raw request body:", req.body);

    const {
      name,
      description,
      hostname,
      ip_address,
      port,
      org,
      bucket,
      token,
    } = req.body;

    // Debug log to verify received values
    console.log("Parsed server creation request:", {
      name,
      description,
      hostname,
      ip_address,
      port,
      org,
      bucket,
      token: token ? "***" : "not set",
    });

    // Validate all required fields with detailed logging
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!hostname) missingFields.push("hostname");
    if (!ip_address) missingFields.push("ip_address");
    if (!org) missingFields.push("org");
    if (!bucket) missingFields.push("bucket");
    if (!token) missingFields.push("token");

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        error: `Required fields missing: ${missingFields.join(", ")}`,
        receivedData: req.body,
      });
    }

    // First, create the UUID
    const [uuidResult] = await db.query("SELECT UUID() as uuid");
    const newId = uuidResult[0].uuid;

    // Debug log the exact values being inserted
    console.log("Values being inserted:", {
      id: newId,
      name,
      description,
      hostname,
      ip_address,
      port,
      org,
      bucket,
      token: token ? "***" : "not set",
    });

    // Insert with explicit UUID and all fields
    const [result] = await db.query(
      `INSERT INTO servers 
       (id, name, description, hostname, ip_address, port, org, bucket, token, status, last_seen, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), NOW())`,
      [
        newId, // id
        name, // name
        description, // description
        hostname, // hostname
        ip_address, // ip_address
        port || 3000, // port
        org, // org
        bucket, // bucket
        token, // token
      ]
    );

    // Log the query result
    console.log("Insert result:", result);

    // Fetch the created server using the UUID
    const [servers] = await db.query(`SELECT * FROM servers WHERE id = ?`, [
      newId,
    ]);

    if (!servers.length) {
      throw new Error("Server was created but could not be retrieved");
    }

    const createdServer = servers[0];
    console.log("Created server:", {
      ...createdServer,
      token: "***",
    });

    res.status(201).json({
      success: true,
      message: "Server created successfully",
      server: createdServer,
    });
  } catch (error) {
    console.error("Error creating server:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create server",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Add this new endpoint to provide InfluxDB defaults
app.get("/api/influxdb/defaults", (req, res) => {
  res.json({
    org: process.env.INFLUXDB_ORG || "EFI",
    bucket: process.env.INFLUXDB_BUCKET || "efi_servers",
    token: process.env.INFLUXDB_TOKEN || "",
  });
});

// Add these new endpoints for metrics

// Get metrics history for a specific server
app.get("/api/servers/:id/metrics/history", async (req, res) => {
  try {
    const { id } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    console.log(`Fetching ${hours}h metrics history for server ${id}`);

    const [results] = await db.query(
      `SELECT 
        timestamp,
        cpu_usage,
        memory_usage,
        disk_usage,
        network_in,
        network_out,
        temperature
       FROM server_metrics
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY timestamp DESC`,
      [id, hours]
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching server metrics history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch server metrics history",
      details: error.message,
    });
  }
});

// Get current metrics for a specific server
app.get("/api/servers/:id/metrics/current", async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query(
      `SELECT 
        cpu_usage,
        memory_usage,
        disk_usage,
        network_in,
        network_out,
        temperature,
        timestamp
       FROM server_metrics
       WHERE server_id = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [id]
    );

    res.json({
      success: true,
      data: results[0] || null,
    });
  } catch (error) {
    console.error("Error fetching current server metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current server metrics",
      details: error.message,
    });
  }
});

// Get server processes
app.get("/api/servers/:id/processes", async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query(
      `SELECT *
       FROM server_processes
       WHERE server_id = ?
       ORDER BY cpu_usage DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching server processes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch server processes",
      details: error.message,
    });
  }
});

// Add this new endpoint for local metrics history
app.get("/api/metrics/local/history", async (req, res) => {
  try {
    // Get system metrics using systeminformation
    const cpuLoad = await si.currentLoad();
    const memory = await si.mem();
    const disk = await si.fsSize();
    const networkStats = await si.networkStats();

    // Create metrics data point
    const metrics = {
      timestamp: new Date(),
      cpu_usage: cpuLoad.currentLoad,
      memory_usage: (memory.used / memory.total) * 100,
      disk_usage: disk[0] ? (disk[0].used / disk[0].size) * 100 : 0,
      network_in: networkStats[0] ? networkStats[0].rx_sec : 0,
      network_out: networkStats[0] ? networkStats[0].tx_sec : 0,
      temperature: 0, // You can add CPU temperature if available
    };

    // Return the metrics
    res.json({
      success: true,
      data: [metrics], // Wrap in array to match history format
    });
  } catch (error) {
    console.error("Error fetching local metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch local metrics",
      details: error.message,
    });
  }
});

// Add endpoint for current local metrics
app.get("/api/metrics/local/current", async (req, res) => {
  try {
    const cpuLoad = await si.currentLoad();
    const memory = await si.mem();
    const disk = await si.fsSize();
    const networkStats = await si.networkStats();

    const metrics = {
      cpu_usage: cpuLoad.currentLoad,
      memory_usage: (memory.used / memory.total) * 100,
      disk_usage: disk[0] ? (disk[0].used / disk[0].size) * 100 : 0,
      network_in: networkStats[0] ? networkStats[0].rx_sec : 0,
      network_out: networkStats[0] ? networkStats[0].tx_sec : 0,
      temperature: 0,
      timestamp: new Date(),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching current local metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch current local metrics",
      details: error.message,
    });
  }
});

// Update the server health endpoint to collect real-time metrics
app.get("/api/servers/:id/health", async (req, res) => {
  try {
    console.log("Health check requested for server:", req.params.id);
    const { id } = req.params;

    // Get server details
    const [servers] = await db.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (servers.length === 0) {
      console.log("Server not found:", id);
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    const server = servers[0];
    console.log("Checking health for server:", server);

    // Try to ping the server
    try {
      console.log(
        `Attempting to connect to http://${server.ip_address}:${server.port}/health`
      );
      const response = await fetch(
        `http://${server.ip_address}:${server.port}/health`,
        {
          timeout: 5000, // 5 seconds timeout
        }
      );

      console.log("Health check response status:", response.status);

      if (response.ok) {
        const healthData = await response.json();
        console.log("Health data received:", healthData);

        // Update server status in database
        await db.query(
          `UPDATE server_uptime 
           SET status = 'online', last_checked = NOW(), uptime = uptime + ?
           WHERE server_id = ?`,
          [60, id]
        );

        return res.json({
          success: true,
          status: "online",
          lastChecked: new Date(),
          system: healthData,
        });
      }
    } catch (error) {
      console.error(`Failed to ping server ${id}:`, error);
    }

    // If we reach here, server is offline
    console.log("Server is offline, updating status");
    await db.query(
      `UPDATE server_uptime 
       SET status = 'offline', last_checked = NOW()
       WHERE server_id = ?`,
      [id]
    );

    return res.json({
      success: true,
      status: "offline",
      lastChecked: new Date(),
      system: null,
    });
  } catch (error) {
    console.error("Error checking server health:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check server health",
      details: error.message,
    });
  }
});

// Add alerts table if it doesn't exist
const createAlertsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(255) PRIMARY KEY,
        server_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('active', 'resolved') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log("Alerts table created or already exists");
  } catch (error) {
    console.error("Error creating alerts table:", error);
  }
};

// Call this when your server starts
createAlertsTable();

// Add this function near your createAlertsTable function
const createMetricsTables = async () => {
  try {
    // Create server_metrics table
    await db.query(`
      CREATE TABLE IF NOT EXISTS server_metrics (
        id VARCHAR(255) PRIMARY KEY,
        server_id VARCHAR(255) NOT NULL,
        cpu_usage FLOAT,
        memory_usage FLOAT,
        memory_total BIGINT,
        memory_used BIGINT,
        disk_usage FLOAT,
        disk_total BIGINT,
        disk_used BIGINT,
        network_in FLOAT,
        network_out FLOAT,
        temperature FLOAT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Create server_processes table if you need it
    await db.query(`
      CREATE TABLE IF NOT EXISTS server_processes (
        id VARCHAR(255) PRIMARY KEY,
        server_id VARCHAR(255) NOT NULL,
        pid INT,
        name VARCHAR(255),
        cpu_usage FLOAT,
        memory_usage FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log("Metrics tables created or already exist");
  } catch (error) {
    console.error("Error creating metrics tables:", error);
  }
};

// Call this when your server starts
createMetricsTables();

// Keep your other routes...

// Add or update the collectAndStoreMetrics function
async function collectAndStoreMetrics() {
  try {
    // Get all active servers
    const [servers] = await db.query(
      'SELECT id FROM servers WHERE status = "active"'
    );

    for (const server of servers) {
      try {
        // Collect system metrics
        const cpuLoad = await si.currentLoad();
        const memory = await si.mem();
        const disk = await si.fsSize();
        const networkStats = await si.networkStats();
        const temp = await si.cpuTemperature();

        // Store metrics in database
        await db.query(
          `INSERT INTO server_metrics 
           (id, server_id, cpu_usage, memory_usage, memory_total, memory_used,
            disk_usage, disk_total, disk_used, network_in, network_out, 
            temperature, timestamp)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            server.id,
            cpuLoad.currentLoad,
            (memory.used / memory.total) * 100,
            memory.total,
            memory.used,
            disk[0] ? (disk[0].used / disk[0].size) * 100 : 0,
            disk[0] ? disk[0].size : 0,
            disk[0] ? disk[0].used : 0,
            networkStats[0] ? networkStats[0].rx_sec : 0,
            networkStats[0] ? networkStats[0].tx_sec : 0,
            temp.main || 0,
          ]
        );
      } catch (error) {
        console.error(
          `Failed to collect metrics for server ${server.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Failed to collect metrics:", error);
  }
}

// Make sure metrics collection is running
setInterval(collectAndStoreMetrics, 60000);
collectAndStoreMetrics(); // Initial collection

// Add this new endpoint for dashboard metrics
app.get("/api/dashboard/metrics", async (req, res) => {
  try {
    // Get total servers count
    const [totalServersResult] = await db.query(
      "SELECT COUNT(*) as count FROM servers"
    );

    // Get active servers count
    const [activeServersResult] = await db.query(
      'SELECT COUNT(*) as count FROM servers WHERE status = "active"'
    );

    // Get total alerts count
    const [totalAlertsResult] = await db.query(
      'SELECT COUNT(*) as count FROM alerts WHERE status = "active"'
    );

    // Get critical alerts count
    const [criticalAlertsResult] = await db.query(
      'SELECT COUNT(*) as count FROM alerts WHERE status = "active" AND type = "critical"'
    );

    res.json({
      totalServers: totalServersResult[0].count,
      activeServers: activeServersResult[0].count,
      totalAlerts: totalAlertsResult[0].count,
      criticalAlerts: criticalAlertsResult[0].count,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard metrics",
      details: error.message,
    });
  }
});

// Add this endpoint for fetching servers
app.get("/api/servers", async (req, res) => {
  try {
    console.log("Fetching servers...");

    const [servers] = await db.query(`
      SELECT 
        s.*,
        su.uptime,
        su.status as current_status,
        su.last_checked as last_seen
      FROM servers s
      LEFT JOIN server_uptime su ON s.id = su.server_id
      ORDER BY s.created_at DESC
    `);

    console.log("Servers fetched:", servers);

    res.json({
      success: true,
      data: servers,
    });
  } catch (error) {
    console.error("Error fetching servers:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch servers",
    });
  }
});

// Add this endpoint for creating servers
app.post("/api/servers", async (req, res) => {
  try {
    console.log("Creating server with data:", req.body);

    const {
      name,
      ip_address,
      hostname,
      description,
      port,
      org,
      bucket,
      token,
    } = req.body;

    // Generate UUID for server ID
    const serverId = uuidv4();

    // Insert server into database
    await db.query(
      `INSERT INTO servers (
        id, name, ip_address, hostname, description, 
        port, org, bucket, token, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        serverId,
        name,
        ip_address,
        hostname,
        description,
        port,
        org,
        bucket,
        token,
      ]
    );

    // Initialize server uptime record
    await db.query(
      `INSERT INTO server_uptime (server_id, status, last_checked, uptime)
       VALUES (?, 'offline', NOW(), 0)`,
      [serverId]
    );

    console.log("Server created successfully with ID:", serverId);

    res.status(201).json({
      success: true,
      message: "Server created successfully",
      serverId,
    });
  } catch (error) {
    console.error("Error creating server:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create server",
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
