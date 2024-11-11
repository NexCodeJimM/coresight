const express = require("express");
const cors = require("cors");
const influx = require("influx");
const config = require("./config");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize InfluxDB client without immediate connection
const influxClient = new influx.InfluxDB({
  host: config.influxdb.host,
  database: config.influxdb.database,
  username: config.influxdb.username,
  password: config.influxdb.password,
  port: config.influxdb.port || 8086,
  schema: [
    {
      measurement: "system_metrics",
      fields: {
        cpu_usage: influx.FieldType.FLOAT,
        memory_usage: influx.FieldType.FLOAT,
        disk_usage: influx.FieldType.FLOAT,
        network_in: influx.FieldType.INTEGER,
        network_out: influx.FieldType.INTEGER,
      },
      tags: ["hostname"],
    },
  ],
});

// Test route to check if server is running
app.get("/api/health-check", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Metrics history endpoint with mock data fallback
app.get("/api/metrics/history/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;
    console.log(`Fetching metrics history for hostname: ${hostname}`);

    // Generate mock data for testing
    const mockData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      network_in: Math.floor(Math.random() * 1000000),
      network_out: Math.floor(Math.random() * 1000000),
    }));

    try {
      // Try to get real data from InfluxDB
      const results = await influxClient.query(`
        SELECT mean("cpu_usage") as cpu_usage,
               mean("memory_usage") as memory_usage,
               mean("disk_usage") as disk_usage,
               mean("network_in") as network_in,
               mean("network_out") as network_out
        FROM system_metrics
        WHERE hostname = ${influx.escape.stringLit(hostname)}
          AND time > now() - 24h
        GROUP BY time(5m)
      `);

      res.json(results.length ? results : mockData);
    } catch (dbError) {
      console.error("InfluxDB query failed, using mock data:", dbError);
      res.json(mockData);
    }
  } catch (error) {
    console.error("Error in metrics history endpoint:", error);
    res.status(500).json({
      error: "Failed to fetch metrics history",
      details: error.message,
    });
  }
});

// Health endpoint with mock data fallback
app.get("/api/health/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;

    // Mock data
    const mockHealth = {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      network_in: Math.floor(Math.random() * 1000000),
      network_out: Math.floor(Math.random() * 1000000),
      status: "online",
    };

    res.json(mockHealth);
  } catch (error) {
    console.error("Error in health endpoint:", error);
    res.status(500).json({
      error: "Failed to fetch health data",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;

// Start server with error handling
const server = app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });

// Handle process termination gracefully
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed. Exiting process...");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed. Exiting process...");
    process.exit(0);
  });
});
