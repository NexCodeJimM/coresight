const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");
const nodemailer = require("nodemailer");
const mysql = require("mysql2");
const config = require("./config");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://165.22.237.60:3000",
    "http://143.198.84.214:3000",
    "http://your-frontend-domain.com",
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
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "efi",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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
    const hours = parseInt(req.query.hours) || 24; // Convert to number safely

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

// Update the server health endpoint to match frontend expectations
app.get("/api/servers/:id/health", async (req, res) => {
  try {
    const { id } = req.params;

    // First check if server exists
    const [servers] = await db.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (!servers.length) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    const server = servers[0];

    // Get system metrics using systeminformation
    const cpuLoad = await si.currentLoad();
    const memory = await si.mem();
    const disk = await si.fsSize();
    const networkStats = await si.networkStats();
    const uptime = os.uptime();

    // Format the health data to match frontend expectations
    const healthData = {
      metrics: {
        cpu: cpuLoad.currentLoad,
        memory: (memory.used / memory.total) * 100,
        memory_total: memory.total,
        memory_used: memory.used,
        disk: (disk[0].used / disk[0].size) * 100,
        disk_total: disk[0].size,
        disk_used: disk[0].used,
        network: {
          in: networkStats[0] ? networkStats[0].rx_sec : 0,
          out: networkStats[0] ? networkStats[0].tx_sec : 0,
        },
      },
      status: "online",
      system: {
        uptime: uptime,
      },
      lastChecked: new Date().toISOString(),
    };

    // Update last_seen timestamp
    await db.query("UPDATE servers SET last_seen = NOW() WHERE id = ?", [id]);

    res.json({
      success: true,
      ...healthData,
    });
  } catch (error) {
    console.error("Error fetching server health:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch server health",
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

// Keep your other routes...

// Add this function to collect and store metrics
async function collectAndStoreMetrics() {
  try {
    const cpuLoad = await si.currentLoad();
    const memory = await si.mem();
    const disk = await si.fsSize();
    const networkStats = await si.networkStats();

    // Get all active servers
    const [servers] = await db.query(
      'SELECT id FROM servers WHERE status = "active"'
    );

    // Store metrics for each server
    for (const server of servers) {
      await db.query(
        `INSERT INTO server_metrics 
         (id, server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, temperature, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          uuidv4(),
          server.id,
          cpuLoad.currentLoad,
          (memory.used / memory.total) * 100,
          disk[0] ? (disk[0].used / disk[0].size) * 100 : 0,
          networkStats[0] ? networkStats[0].rx_sec : 0,
          networkStats[0] ? networkStats[0].tx_sec : 0,
          0, // temperature
        ]
      );
    }
  } catch (error) {
    console.error("Error collecting metrics:", error);
  }
}

// Collect metrics every minute
setInterval(collectAndStoreMetrics, 60000);

// Also collect metrics on startup
collectAndStoreMetrics();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
