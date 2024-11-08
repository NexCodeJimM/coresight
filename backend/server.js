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
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Add security middleware
app.use(helmet());

// Add rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);

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

// Query endpoint for frontend
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

    if (rows.length === 0) {
      logger.warn("No data found for this host");
      return res.status(404).json({ error: "No data found for this host" });
    }

    // Format the data into a more readable structure
    const formattedData = {
      cpu: {
        percent: [],
        count: [],
        frequency: [],
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

    // Process each row and organize by measurement type
    rows.forEach((row) => {
      const timestamp = new Date(row._time).toLocaleString();
      const value = row._value;
      const measurement = row._measurement;
      const field = row._field;

      switch (measurement) {
        case "cpu":
          formattedData.cpu[field].push({
            time: timestamp,
            value: value,
          });
          break;
        case "memory":
          formattedData.memory[field].push({
            time: timestamp,
            value: value,
          });
          break;
        case "disk":
          formattedData.disk[field].push({
            time: timestamp,
            value: value,
          });
          break;
        case "network":
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
      }
    });

    // Add summary of latest values
    const summary = {
      lastUpdate: new Date().toLocaleString(),
      cpu: {
        current_usage: formattedData.cpu.percent[0]?.value || 0,
        count: formattedData.cpu.count[0]?.value || 0,
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

// Add HTTPS support if certificates exist
if (process.env.NODE_ENV === "production") {
  const privateKey = fs.readFileSync("/path/to/private.key", "utf8");
  const certificate = fs.readFileSync("/path/to/certificate.crt", "utf8");
  const credentials = { key: privateKey, cert: certificate };

  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(443, () => {
    logger.info("HTTPS Server running on port 443");
  });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
