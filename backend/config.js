const config = {
  development: {
    port: 3000,
    influxdb: {
      url: "http://165.22.237.60:8086",
      org: "EFI",
      bucket: "efi_servers",
    },
  },
  production: {
    port: process.env.PORT || 3000,
    influxdb: {
      url: process.env.INFLUXDB_URL,
      org: process.env.INFLUXDB_ORG,
      bucket: process.env.INFLUXDB_BUCKET,
    },
  },
};

module.exports = config[process.env.NODE_ENV || "development"];
