const express = require("express");
const cors = require("cors");
const os = require("os");
const si = require("systeminformation");
const diskinfo = require("node-disk-info");
const nodemailer = require("nodemailer");
const mysql = require("mysql2");
const config = require("./config");
require("dotenv").config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://165.22.237.60:3000",
    "http://143.198.84.214:3000",
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

    console.log("Received server creation request:", {
      name,
      description,
      hostname,
      ip_address,
      port,
      org,
      bucket,
      tokenLength: token ? token.length : 0,
    });

    // Validate required fields
    if (!name || !hostname || !ip_address || !org || !bucket || !token) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
        receivedData: {
          name: !!name,
          description: !!description,
          hostname: !!hostname,
          ip_address: !!ip_address,
          port: !!port,
          org: !!org,
          bucket: !!bucket,
          token: !!token,
        },
      });
    }

    // Insert into MySQL database with description
    const [result] = await db.query(
      `INSERT INTO servers 
       (id, name, description, hostname, ip_address, port, org, bucket, token, status, created_at, updated_at) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [name, description, hostname, ip_address, port, org, bucket, token]
    );

    // Fetch the created server to return
    const [servers] = await db.query(
      `SELECT id, name, description, hostname, ip_address, port, org, bucket, token, status, created_at, updated_at
       FROM servers 
       WHERE id = LAST_INSERT_ID()`
    );

    const createdServer = servers[0];
    console.log("Created server:", { ...createdServer, token: "***" });

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

// Keep your other routes...

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
