const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");
const nodemailer = require("nodemailer");
const mysql = require("mysql2");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const dns = require('dns');
const { promisify } = require('util');
const lookup = promisify(dns.lookup);

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
  allowedHeaders: ["Content-Type", "Authorization"],
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

// Update the server health endpoint to include alert creation
app.get("/api/servers/:id/health", async (req, res) => {
  try {
    const { id } = req.params;
    const [servers] = await db.query("SELECT * FROM servers WHERE id = ?", [id]);

    if (servers.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    const server = servers[0];
    let isServerDown = false;

    try {
      const response = await fetch(
        `http://${server.ip_address}:${server.port}/health`,
        { timeout: 5000 }
      );

      if (response.ok) {
        const healthData = await response.json();
        
        // Update server status to online
        await db.query(
          `UPDATE server_uptime 
           SET status = 'online', last_checked = NOW(), uptime = uptime + ?
           WHERE server_id = ?`,
          [60, id]
        );

        // If server was previously down, create an "up" alert
        const [previousStatus] = await db.query(
          `SELECT status FROM server_uptime WHERE server_id = ? ORDER BY last_checked DESC LIMIT 1`,
          [id]
        );

        if (previousStatus.length && previousStatus[0].status === 'offline') {
          await db.query(
            `INSERT INTO alerts (id, server_id, severity, message, created_at)
             VALUES (UUID(), ?, 'info', ?, NOW())`,
            [id, `Server ${server.name} is back online`]
          );
        }

        return res.json({
          success: true,
          status: "online",
          lastChecked: new Date(),
          system: healthData,
        });
      }
      isServerDown = true;
    } catch (error) {
      console.error(`Failed to ping server ${id}:`, error);
      isServerDown = true;
    }

    if (isServerDown) {
      // Update server status to offline
      await db.query(
        `UPDATE server_uptime 
         SET status = 'offline', last_checked = NOW()
         WHERE server_id = ?`,
        [id]
      );

      // Create critical alert for server down with updated fields
      await db.query(
        `INSERT INTO alerts (
          id, server_id, type, severity, message, 
          status, priority, created_at
        ) VALUES (
          UUID(), ?, 'network', 'critical', ?, 
          'active', 'critical', NOW()
        )`,
        [id, `Server ${server.name} is not responding`]
      );

      return res.json({
        success: true,
        status: "offline",
        lastChecked: new Date(),
        system: null,
      });
    }
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
        id VARCHAR(255) NOT NULL,
        server_id VARCHAR(255) DEFAULT NULL,
        website_id VARCHAR(255) DEFAULT NULL,
        type ENUM('cpu', 'memory', 'disk', 'network', 'website') NOT NULL,
        severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
        message TEXT NOT NULL,
        status ENUM('active', 'resolved') DEFAULT 'active',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL DEFAULT NULL,
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        PRIMARY KEY (id),
        KEY idx_alerts_created_at (created_at),
        KEY idx_alerts_server_id (server_id),
        KEY fk_alerts_website (website_id),
        CONSTRAINT fk_alerts_server FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE,
        CONSTRAINT fk_alerts_website FOREIGN KEY (website_id) REFERENCES monitored_websites (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("Alerts table created or already exists");
  } catch (error) {
    console.error("Error creating alerts table:", error);
  }
};

// Call this when your server starts
createAlertsTable();

// Add a function to check server status periodically
async function checkAllServersHealth() {
  try {
    const [servers] = await db.query('SELECT s.*, su.status as previous_status FROM servers s LEFT JOIN server_uptime su ON s.id = su.server_id WHERE s.status = "active"');
    
    for (const server of servers) {
      try {
        const response = await fetch(
          `http://${server.ip_address}:${server.port}/health`,
          { timeout: 5000 }
        );

        const isOnline = response.ok;
        const currentStatus = isOnline ? 'online' : 'offline';
        const previousStatus = server.previous_status || 'unknown';

        // Update status
        await db.query(
          `UPDATE server_uptime SET status = ?, last_checked = NOW() WHERE server_id = ?`,
          [currentStatus, server.id]
        );

        // Create alert and notification if status changed
        if (previousStatus !== currentStatus) {
          const severity = currentStatus === 'offline' ? 'critical' : 'low';
          const message = currentStatus === 'offline' 
            ? `Server ${server.name} is not responding`
            : `Server ${server.name} is back online`;

          // Insert alert
          await db.query(
            `INSERT INTO alerts (
              id, server_id, type, severity, message,
              status, priority, created_at
            ) VALUES (
              UUID(), ?, 'network', ?, ?,
              'active', ?, NOW()
            )`,
            [
              server.id,
              severity,
              message,
              severity
            ]
          );

          // Insert notification
          await db.query(
            `INSERT INTO notifications (
              id, type, message, data, is_read, created_at
            ) VALUES (
              UUID(), 'server_status', ?, ?, 0, NOW()
            )`,
            [
              message,
              JSON.stringify({
                server_id: server.id,
                server_name: server.name,
                status: currentStatus,
                severity: severity,
                previous_status: previousStatus
              })
            ]
          );

          console.log(`Created alert and notification for server ${server.name}: ${currentStatus} (was: ${previousStatus})`);
        }
      } catch (error) {
        console.error(`Error checking server ${server.id}:`, error);
        
        // Only create alert and notification if server wasn't already offline
        if (server.previous_status !== 'offline') {
          // Create alert for connection error
          await db.query(
            `INSERT INTO alerts (
              id, server_id, type, severity, message,
              status, priority, created_at
            ) VALUES (
              UUID(), ?, 'network', 'critical', ?,
              'active', 'critical', NOW()
            )`,
            [server.id, `Server ${server.name} is not responding: ${error.message}`]
          );

          // Create notification for error
          await db.query(
            `INSERT INTO notifications (
              id, type, message, data, is_read, created_at
            ) VALUES (
              UUID(), 'server_error', ?, ?, 0, NOW()
            )`,
            [
              `Server ${server.name} is not responding: ${error.message}`,
              JSON.stringify({
                server_id: server.id,
                server_name: server.name,
                error: error.message,
                severity: 'critical',
                previous_status: server.previous_status
              })
            ]
          );
        }

        // Update status to offline
        await db.query(
          `UPDATE server_uptime SET status = 'offline', last_checked = NOW() WHERE server_id = ?`,
          [server.id]
        );
      }
    }
  } catch (error) {
    console.error('Error in checkAllServersHealth:', error);
  }
}

// Make sure to call this function periodically
setInterval(checkAllServersHealth, 60000); // Check every minute
checkAllServersHealth(); // Initial check

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

// Add this endpoint for server metrics
app.get("/api/servers/:id/metrics", async (req, res) => {
  try {
    const { id } = req.params;

    // Get current metrics
    const [currentMetrics] = await db.query(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [id]
    );

    // Get historical metrics (last 24 hours)
    const [historicalMetrics] = await db.query(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY timestamp ASC`,
      [id]
    );

    // Get server details to check if it exists
    const [servers] = await db.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (servers.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    // Try to get real-time metrics from the server
    try {
      const server = servers[0];
      const response = await fetch(
        `http://${server.ip_address}:${server.port}/health`
      );

      if (response.ok) {
        const healthData = await response.json();

        // Store the new metrics
        await db.query(
          `INSERT INTO server_metrics (
            id, server_id, cpu_usage, memory_usage, 
            disk_usage, network_usage, timestamp
          ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
          [
            id,
            healthData.cpu.usage,
            healthData.memory.usage,
            healthData.disk.usage,
            healthData.network?.usage || 0,
          ]
        );

        // Update currentMetrics with the latest data
        currentMetrics[0] = {
          cpu_usage: healthData.cpu.usage,
          memory_usage: healthData.memory.usage,
          disk_usage: healthData.disk.usage,
          network_usage: healthData.network?.usage || 0,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error("Error fetching real-time metrics:", error);
    }

    return res.json({
      success: true,
      current: currentMetrics[0] || null,
      history: historicalMetrics,
    });
  } catch (error) {
    console.error("Error fetching server metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch server metrics",
      details: error.message,
    });
  }
});

// Update the metrics endpoint to store all values
app.post("/api/metrics", async (req, res) => {
  try {
    const metrics = req.body;
    const serverId = metrics.server_id;
    const metricId = require("crypto").randomUUID();

    // Store metrics in database with generated ID
    await db.query(
      `INSERT INTO server_metrics (
        id, 
        server_id, 
        cpu_usage, 
        memory_usage,
        memory_total,
        memory_used,
        disk_usage,
        disk_total,
        disk_used,
        network_usage,
        network_in,
        network_out,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        metricId,
        serverId,
        metrics.cpu.cpu_percent,
        metrics.memory.percent,
        metrics.memory.total,
        metrics.memory.used,
        metrics.disk.percent,
        metrics.disk.total,
        metrics.disk.used,
        (metrics.network.bytes_sent + metrics.network.bytes_recv) /
          (1024 * 1024), // Total network in MB/s
        metrics.network.bytes_recv / (1024 * 1024), // Network in in MB/s
        metrics.network.bytes_sent / (1024 * 1024), // Network out in MB/s
      ]
    );

    // Store process information if available
    if (metrics.processes && Array.isArray(metrics.processes)) {
      // Clear old processes for this server
      await db.query('DELETE FROM server_processes WHERE server_id = ?', [serverId]);

      // Insert new process information
      for (const process of metrics.processes) {
        await db.query(
          `INSERT INTO server_processes 
           (id, server_id, pid, name, cpu_usage, memory_usage, disk_usage, timestamp) 
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
          [
            serverId,
            process.pid,
            process.name,
            process.cpu_usage || process.cpu_percent,
            process.memory_usage || process.memory_percent,
            process.disk_usage || 0,
          ]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error storing metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to store metrics",
      details: error.message,
    });
  }
});

// Add or update the server details endpoint
app.get("/api/servers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get server details with uptime status
    const [servers] = await db.query(
      `SELECT 
        s.*,
        su.status as current_status,
        su.last_checked as last_seen,
        su.uptime
      FROM servers s
      LEFT JOIN server_uptime su ON s.id = su.server_id
      WHERE s.id = ?`,
      [id]
    );

    if (!servers.length) {
      return res.status(404).json({
        success: false,
        error: "Server not found",
      });
    }

    const server = servers[0];

    res.json({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        ip_address: server.ip_address,
        hostname: server.hostname,
        description: server.description,
        status: server.current_status || "unknown",
        last_seen: server.last_seen,
        uptime: server.uptime || 0,
        created_at: server.created_at,
        updated_at: server.updated_at,
      },
    });
  } catch (error) {
    console.error("Error fetching server details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch server details",
      details: error.message,
    });
  }
});

// Update the server details endpoint to handle DELETE
app.delete("/api/servers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attempting to delete server:", id);

    // Start a transaction
    await db.query("START TRANSACTION");

    try {
      // Delete related records first
      await db.query("DELETE FROM server_uptime WHERE server_id = ?", [id]);
      await db.query("DELETE FROM server_processes WHERE server_id = ?", [id]);
      await db.query("DELETE FROM server_metrics WHERE server_id = ?", [id]);
      await db.query("DELETE FROM alerts WHERE server_id = ?", [id]);
      await db.query("DELETE FROM server_actions WHERE server_id = ?", [id]);

      // Finally delete the server
      const [result] = await db.query("DELETE FROM servers WHERE id = ?", [id]);

      if (result.affectedRows === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Server not found",
        });
      }

      await db.query("COMMIT");

      res.json({
        success: true,
        message: "Server deleted successfully",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting server:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete server",
      details: error.message,
    });
  }
});

// Add auth middleware
app.use((req, res, next) => {
  // Handle auth headers
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // You can verify the token here if needed
    console.log("Auth header present:", authHeader);
  }
  next();
});

// Add session endpoint
app.get("/api/auth/session", async (req, res) => {
  try {
    // Return session info
    res.json({
      user: req.user || null,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

// Add a health check endpoint
app.get("/api/auth/csrf", (req, res) => {
  res.json({ csrfToken: "token" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Handle 404s
app.use((req, res) => {
  console.log("404 Not Found:", req.method, req.url);
  res.status(404).json({
    success: false,
    error: "Not found",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Website monitoring service
async function checkWebsiteStatus(website) {
  const startTime = Date.now();
  let status = 'down';
  let responseTime = null;
  let errorMessage = null;

  try {
    // First, try to resolve the domain
    const domain = new URL(website.url).hostname;
    await lookup(domain);

    // Try GET request instead of HEAD, with proper headers
    const response = await fetch(website.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CoreSight/1.0; +http://example.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 10000, // 10 seconds timeout
      redirect: 'follow', // Follow redirects
    });

    responseTime = Date.now() - startTime;
    // Consider 2xx and 3xx status codes as 'up'
    status = (response.status >= 200 && response.status < 400) ? 'up' : 'down';
    if (status === 'down') {
      errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
    }

  } catch (error) {
    console.error(`Error checking website ${website.url}:`, error);
    errorMessage = error.message;

    // Try one more time with http if https fails
    if (website.url.startsWith('https://')) {
      try {
        const httpUrl = website.url.replace('https://', 'http://');
        const response = await fetch(httpUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CoreSight/1.0; +http://example.com)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
          timeout: 10000,
          redirect: 'follow',
        });
        responseTime = Date.now() - startTime;
        status = (response.status >= 200 && response.status < 400) ? 'up' : 'down';
        if (status === 'down') {
          errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        } else {
          errorMessage = null;
        }
      } catch (retryError) {
        status = 'down';
        errorMessage = retryError.message;
      }
    } else {
      status = 'down';
      errorMessage = error.message;
    }
  }

  try {
    // Update website status
    await db.query(
      `UPDATE monitored_websites 
       SET status = ?, 
           last_checked = NOW(), 
           response_time = ? 
       WHERE id = ?`,
      [status, responseTime, website.id]
    );

    // Record uptime history with error message
    await db.query(
      `INSERT INTO website_uptime (
        id, website_id, status, response_time, error_message, timestamp
      ) VALUES (UUID(), ?, ?, ?, ?, NOW())`,
      [website.id, status, responseTime, errorMessage]
    );

    // If status changed, create an alert
    const [previousStatus] = await db.query(
      `SELECT status FROM website_uptime 
       WHERE website_id = ? 
       AND id != LAST_INSERT_ID()
       ORDER BY timestamp DESC LIMIT 1`,
      [website.id]
    );

    if (previousStatus.length && previousStatus[0].status !== status) {
      await db.query(
        `INSERT INTO alerts (
          id, website_id, type, message, status
        ) VALUES (UUID(), ?, ?, ?, 'active')`,
        [
          website.id,
          status === 'down' ? 'error' : 'info',
          status === 'down'
            ? `Website ${website.name} is down: ${errorMessage}`
            : `Website ${website.name} is back online`
        ]
      );
    }

  } catch (error) {
    console.error(`Error updating website status for ${website.url}:`, error);
  }
}

async function monitorWebsites() {
  try {
    // Get all websites
    const [websites] = await db.query('SELECT * FROM monitored_websites');

    // Check each website based on its check interval
    for (const website of websites) {
      const [lastCheck] = await db.query(
        `SELECT timestamp FROM website_uptime 
         WHERE website_id = ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [website.id]
      );

      const lastCheckTime = lastCheck.length ? new Date(lastCheck[0].timestamp) : new Date(0);
      const timeSinceLastCheck = Date.now() - lastCheckTime.getTime();

      // Check if it's time to monitor this website again
      if (timeSinceLastCheck >= website.check_interval * 1000) {
        await checkWebsiteStatus(website);
      }
    }
  } catch (error) {
    console.error('Error in website monitoring:', error);
  }
}

// Start website monitoring
const MONITOR_INTERVAL = 10000; // Check every 10 seconds
setInterval(monitorWebsites, MONITOR_INTERVAL);
monitorWebsites(); // Initial check

// Add API endpoint for website uptime history
app.get("/api/websites/:id/uptime", async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const [uptimeHistory] = await db.query(
      `SELECT status, response_time, timestamp
       FROM website_uptime 
       WHERE website_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY timestamp ASC`,
      [id, hours]
    );

    // Calculate uptime percentage
    const totalChecks = uptimeHistory.length;
    const upChecks = uptimeHistory.filter(check => check.status === 'up').length;
    const uptimePercentage = totalChecks > 0 
      ? (upChecks / totalChecks * 100).toFixed(2)
      : 100;

    // Calculate average response time
    const validResponseTimes = uptimeHistory
      .filter(check => check.response_time != null)
      .map(check => check.response_time);
    const avgResponseTime = validResponseTimes.length > 0
      ? (validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length).toFixed(2)
      : null;

    res.json({
      success: true,
      uptime: {
        percentage: uptimePercentage,
        avgResponseTime,
        history: uptimeHistory
      }
    });
  } catch (error) {
    console.error("Error fetching website uptime:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch website uptime",
      details: error.message
    });
  }
});

// Add API endpoint for website alerts
app.get("/api/websites/:id/alerts", async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active' } = req.query;

    const [alerts] = await db.query(
      `SELECT * FROM alerts 
       WHERE website_id = ? 
       AND status = ?
       ORDER BY created_at DESC`,
      [id, status]
    );

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error("Error fetching website alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch website alerts",
      details: error.message
    });
  }
});

// POST new website
app.post("/api/websites", async (req, res) => {
  let connection;
  try {
    const { name, url, checkInterval } = req.body;

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format",
      });
    }

    // Get a connection for transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Generate UUID for the new website
    const websiteId = require("crypto").randomUUID();

    // Initial ping to check if website is accessible
    try {
      const pingStart = Date.now();
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
      const pingEnd = Date.now();
      const responseTime = pingEnd - pingStart;
      const initialStatus = response.ok ? 'up' : 'down';

      // Insert website with initial status
      await connection.query(
        `INSERT INTO monitored_websites (
          id, name, url, check_interval, status, 
          last_checked, response_time
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
        [websiteId, name, url, checkInterval, initialStatus, responseTime]
      );

      // Record first uptime entry using the websiteId
      await connection.query(
        `INSERT INTO website_uptime (
          id, website_id, status, response_time, timestamp
        ) VALUES (UUID(), ?, ?, ?, NOW())`,
        [websiteId, initialStatus, responseTime]
      );

      await connection.commit();

      // Fetch the created website
      const [websites] = await connection.query(
        'SELECT * FROM monitored_websites WHERE id = ?',
        [websiteId]
      );

      res.json({
        success: true,
        website: websites[0],
      });

    } catch (error) {
      // If initial ping fails or any other error occurs
      // Insert website with down status
      await connection.query(
        `INSERT INTO monitored_websites (
          id, name, url, check_interval, status, 
          last_checked
        ) VALUES (?, ?, ?, ?, 'down', NOW())`,
        [websiteId, name, url, checkInterval]
      );

      // Record first downtime entry
      await connection.query(
        `INSERT INTO website_uptime (
          id, website_id, status, timestamp
        ) VALUES (UUID(), ?, 'down', NOW())`,
        [websiteId]
      );

      await connection.commit();

      const [websites] = await connection.query(
        'SELECT * FROM monitored_websites WHERE id = ?',
        [websiteId]
      );

      res.json({
        success: true,
        website: websites[0],
      });
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error creating website:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create website monitor",
      details: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
