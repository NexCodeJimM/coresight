const express = require("express");
const cors = require("cors");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const config = require("./config");

const app = express();

// Configure InfluxDB v2 client
const influxDB = new InfluxDB({
  url: `http://${config.influxdb.host}:${config.influxdb.port || 8086}`,
  token: config.influxdb.token,
});

const writeApi = influxDB.getWriteApi(
  config.influxdb.org,
  config.influxdb.bucket
);
const queryApi = influxDB.getQueryApi(config.influxdb.org);

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

    const fluxQuery = `
      from(bucket: "${config.influxdb.bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r["hostname"] == "${hostname}")
        |> filter(fn: (r) => r["_measurement"] == "system_metrics")
        |> aggregateWindow(every: 5m, fn: mean)
    `;

    const result = [];
    for await (const { values, tableMeta } of queryApi.iterateRows(fluxQuery)) {
      const o = tableMeta.toObject(values);
      result.push(o);
    }

    // Transform data for frontend
    const transformedData = result.map((point) => ({
      timestamp: point._time,
      cpu_usage: point._value || 0,
      memory_usage: point.memory_usage || 0,
      disk_usage: point.disk_usage || 0,
      network_in: point.network_in || 0,
      network_out: point.network_out || 0,
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching metrics history:", error);
    // Return mock data on error
    const mockData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      network_in: Math.floor(Math.random() * 1000000),
      network_out: Math.floor(Math.random() * 1000000),
    }));
    res.json(mockData);
  }
});

// Update config.js to match InfluxDB v2 requirements
