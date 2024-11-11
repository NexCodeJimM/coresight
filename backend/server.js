const express = require("express");
const cors = require("cors");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const winston = require("winston");
require("dotenv").config();
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const https = require("https");
const fs = require("fs");

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console(),
  ],
});

// Initialize Express app
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Local development
      "http://165.22.237.60", // Production server
      "http://165.22.237.60:3000", // Production server with port
      // Add any other allowed origins
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);
app.use(express.json());
app.use(express.static("public"));

// Add security middleware
app.use(helmet());

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use(limiter);

// Initialize InfluxDB client
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

const writeApi = influxDB.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET
);

// Helper function to write metrics to InfluxDB
const writeMetricsToInflux = async (metrics) => {
  try {
    logger.info("Attempting to write to InfluxDB...");

    // CPU Metrics
    const cpuPoint = new Point("cpu")
      .tag("host", metrics.hostname)
      .floatField("cpu_percent", metrics.cpu.cpu_percent)
      .intField("cpu_count", metrics.cpu.cpu_count)
      .floatField("cpu_freq_current", metrics.cpu.cpu_freq.current);

    // Memory Metrics
    const memoryPoint = new Point("memory")
      .tag("host", metrics.hostname)
      .intField("total", metrics.memory.total)
      .intField("used", metrics.memory.used)
      .intField("available", metrics.memory.available)
      .floatField("percent", metrics.memory.percent);

    // Disk Metrics
    const diskPoint = new Point("disk")
      .tag("host", metrics.hostname)
      .intField("total", metrics.disk.total)
      .intField("used", metrics.disk.used)
      .intField("free", metrics.disk.free)
      .floatField("percent", metrics.disk.percent);

    // Network Metrics
    const networkPoint = new Point("network")
      .tag("host", metrics.hostname)
      .intField("bytes_sent", metrics.network.bytes_sent)
      .intField("bytes_recv", metrics.network.bytes_recv)
      .intField("packets_sent", metrics.network.packets_sent)
      .intField("packets_recv", metrics.network.packets_recv);

    // Write all points
    writeApi.writePoint(cpuPoint);
    writeApi.writePoint(memoryPoint);
    writeApi.writePoint(diskPoint);
    writeApi.writePoint(networkPoint);

    // Write process metrics
    metrics.processes.forEach((process) => {
      const processPoint = new Point("process")
        .tag("host", metrics.hostname)
        .tag("process_name", process.name)
        .intField("pid", process.pid)
        .floatField("cpu_percent", process.cpu_percent)
        .floatField("memory_percent", process.memory_percent);

      writeApi.writePoint(processPoint);
    });

    await writeApi.flush();
    logger.info("Successfully wrote to InfluxDB");
    return true;
  } catch (error) {
    logger.error("Error writing to InfluxDB:", error.stack);
    throw error;
  }
};

// API endpoint to receive metrics
app.post("/api/metrics", async (req, res) => {
  try {
    const metrics = req.body;
    logger.info("Received metrics:", JSON.stringify(metrics));

    if (!metrics || !metrics.hostname) {
      logger.error("Invalid metrics format");
      return res.status(400).json({ error: "Invalid metrics format" });
    }

    await writeMetricsToInflux(metrics);
    logger.info(`Received and stored metrics from ${metrics.hostname}`);
    res.status(200).json({ message: "Metrics stored successfully" });
  } catch (error) {
    logger.error("Error processing metrics:", error.stack);
    res
      .status(500)
      .json({ error: `Failed to store metrics: ${error.message}` });
  }
});

// Add debug logging function
const debugRow = (row) => {
  logger.info("Row details:", {
    measurement: row._measurement,
    field: row._field,
    value: row._value,
    time: row._time,
    allFields: Object.keys(row),
  });
};

// Update the query endpoint
app.get("/api/metrics/:host", async (req, res) => {
  const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);
  const host = req.params.host;

  logger.info(`Attempting to fetch metrics for host: ${host}`);

  const query = `
    from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["host"] == "${host}")
  `;

  try {
    logger.info(`Executing query: ${query}`);
    const rows = await queryApi.collectRows(query);
    logger.info(`Query returned ${rows.length} rows`);

    // Log the first few rows to see their structure
    logger.info("Sample rows:", rows.slice(0, 2));

    // Initialize data structure
    const formattedData = {
      cpu: {
        cpu_percent: [],
        cpu_count: [],
        cpu_freq_current: [],
      },
      memory: {
        total: [],
        used: [],
        available: [],
        percent: [],
      },
      disk: {
        total: [],
        used: [],
        free: [],
        percent: [],
      },
      network: {
        bytes_sent: [],
        bytes_recv: [],
        packets_sent: [],
        packets_recv: [],
      },
      processes: [],
    };

    // Process each row
    rows.forEach((row) => {
      debugRow(row); // Log details of each row

      const timestamp = new Date(row._time).toLocaleString();
      const value = row._value;
      const measurement = row._measurement;
      const field = row._field;

      try {
        switch (measurement) {
          case "cpu":
            if (!formattedData.cpu.hasOwnProperty(field)) {
              logger.warn(`Unknown CPU field: ${field}`);
              formattedData.cpu[field] = [];
            }
            formattedData.cpu[field].push({
              time: timestamp,
              value: value,
            });
            break;

          case "memory":
            if (!formattedData.memory.hasOwnProperty(field)) {
              logger.warn(`Unknown memory field: ${field}`);
              formattedData.memory[field] = [];
            }
            formattedData.memory[field].push({
              time: timestamp,
              value: value,
            });
            break;

          case "disk":
            if (!formattedData.disk.hasOwnProperty(field)) {
              logger.warn(`Unknown disk field: ${field}`);
              formattedData.disk[field] = [];
            }
            formattedData.disk[field].push({
              time: timestamp,
              value: value,
            });
            break;

          case "network":
            if (!formattedData.network.hasOwnProperty(field)) {
              logger.warn(`Unknown network field: ${field}`);
              formattedData.network[field] = [];
            }
            formattedData.network[field].push({
              time: timestamp,
              value: value,
            });
            break;

          case "process":
            formattedData.processes.push({
              time: timestamp,
              name: row.process_name,
              pid: value,
              cpu_percent: row.cpu_percent,
              memory_percent: row.memory_percent,
            });
            break;

          default:
            logger.warn(`Unknown measurement type: ${measurement}`);
        }
      } catch (error) {
        logger.error(`Error processing row: ${error.message}`, {
          measurement,
          field,
          value,
          row: JSON.stringify(row),
        });
      }
    });

    // Create summary
    const summary = {
      lastUpdate: new Date().toLocaleString(),
      cpu: {
        current_usage: formattedData.cpu.cpu_percent[0]?.value || 0,
        count: formattedData.cpu.cpu_count[0]?.value || 0,
      },
      memory: {
        percent_used: formattedData.memory.percent[0]?.value || 0,
        total_gb:
          (formattedData.memory.total[0]?.value || 0) / (1024 * 1024 * 1024),
      },
      disk: {
        percent_used: formattedData.disk.percent[0]?.value || 0,
        total_gb:
          (formattedData.disk.total[0]?.value || 0) / (1024 * 1024 * 1024),
      },
      network: {
        bytes_sent_mb:
          (formattedData.network.bytes_sent[0]?.value || 0) / (1024 * 1024),
        bytes_recv_mb:
          (formattedData.network.bytes_recv[0]?.value || 0) / (1024 * 1024),
      },
    };

    res.json({
      summary,
      details: formattedData,
    });
  } catch (error) {
    logger.error("Error querying metrics:", error);
    res.status(500).json({ error: "Failed to retrieve metrics" });
  }
});

// Add this near your other endpoints
app.get("/api/test-influx", async (req, res) => {
  try {
    const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);
    const query = `from(bucket: "${process.env.INFLUXDB_BUCKET}") |> range(start: -1m)`;

    await queryApi.collectRows(query);
    res.json({ status: "InfluxDB connection successful" });
  } catch (error) {
    logger.error("InfluxDB connection test failed:", error);
    res.status(500).json({
      error: "InfluxDB connection failed",
      details: error.message,
    });
  }
});

// Add this diagnostic endpoint
app.get("/api/debug/metrics", async (req, res) => {
  const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);

  const query = `
    from(bucket: "${process.env.INFLUXDB_BUCKET}")
      |> range(start: -1h)
      |> yield()
  `;

  try {
    const rows = await queryApi.collectRows(query);
    res.json({
      rowCount: rows.length,
      organization: process.env.INFLUXDB_ORG,
      bucket: process.env.INFLUXDB_BUCKET,
      sampleData: rows.slice(0, 5),
      uniqueHosts: [...new Set(rows.map((row) => row.host))],
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      config: {
        url: process.env.INFLUXDB_URL,
        org: process.env.INFLUXDB_ORG,
        bucket: process.env.INFLUXDB_BUCKET,
      },
    });
  }
});

// Add this before your routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return res.status(200).json({});
  }
  next();
});

// Add error handling for CORS
app.use((err, req, res, next) => {
  if (err.name === "CORSError") {
    logger.error("CORS Error:", err);
    return res.status(403).json({
      error: "CORS error",
      message: "Origin not allowed",
      origin: req.headers.origin,
    });
  }
  next(err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
