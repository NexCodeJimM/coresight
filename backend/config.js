module.exports = {
  influxdb: {
    host: "165.22.237.60",
    database: "efi_servers",
    username: "jimm",
    password: "Rjmendoza21!",
    port: 8086,
  },
  server: {
    port: 3000,
    cors: {
      origin: ["http://localhost:3000", "http://165.22.237.60:3000"],
      credentials: true,
    },
  },
};
