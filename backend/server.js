const express = require("express");
const cors = require("cors");
const influx = require("influx"); // Make sure influxdb is installed
const config = require("./config");
const app = express();

// Configure InfluxDB with more options
const influxClient = new influx.InfluxDB({
  host: config.influxdb.host,
  database: config.influxdb.database,
  username: config.influxdb.username,
  password: config.influxdb.password,
  port: config.influxdb.port,
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

// Test InfluxDB connection on startup
async function testInfluxConnection() {
  try {
    const names = await influxClient.getDatabaseNames();
    console.log("Connected to InfluxDB successfully");
    console.log("Available databases:", names);

    if (!names.includes(config.influxdb.database)) {
      console.log(`Creating database ${config.influxdb.database}`);
      await influxClient.createDatabase(config.influxdb.database);
    }
  } catch (err) {
    console.error("Error connecting to InfluxDB:", err);
    process.exit(1); // Exit if we can't connect to InfluxDB
  }
}

testInfluxConnection();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Metrics history endpoint
app.get("/api/metrics/history/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;
    console.log(`Fetching metrics history for hostname: ${hostname}`);

    // Test query to check connection
    const testQuery = await influxClient.query(`SHOW MEASUREMENTS`);
    console.log("Available measurements:", testQuery);

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

    console.log("Query results:", results);

    const metrics = results.map((point) => ({
      timestamp: point.time,
      cpu_usage: point.cpu_usage || 0,
      memory_usage: point.memory_usage || 0,
      disk_usage: point.disk_usage || 0,
      network_in: point.network_in || 0,
      network_out: point.network_out || 0,
    }));

    res.json(metrics);
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      query: error.query,
    });
    res.status(500).json({
      error: "Failed to fetch metrics history",
      details: error.message,
      query: error.query,
    });
  }
});

// Health check endpoint
app.get("/api/health/:hostname", async (req, res) => {
  try {
    const { hostname } = req.params;
    console.log(`Fetching health for hostname: ${hostname}`);

    // Get the latest metrics
    const result = await influxClient.query(`
      SELECT last("cpu_usage") as cpu_usage,
             last("memory_usage") as memory_usage,
             last("disk_usage") as disk_usage,
             last("network_in") as network_in,
             last("network_out") as network_out
      FROM system_metrics
      WHERE hostname = ${influx.escape.stringLit(hostname)}
    `);

    const metrics = result[0] || {
      cpu_usage: 0,
      memory_usage: 0,
      disk_usage: 0,
      network_in: 0,
      network_out: 0,
    };

    res.json({
      hostname,
      timestamp: new Date(),
      metrics,
      status: "online",
    });
  } catch (error) {
    console.error("Error fetching health:", error);
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
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
