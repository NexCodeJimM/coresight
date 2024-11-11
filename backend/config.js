module.exports = {
  influxdb: {
    host: "intel-test-server-ca",
    database: "efi_servers",
    username: "jimm", // if required
    password: "Rjmendoza21!", // if required
  },
  server: {
    port: 3000,
    cors: {
      origin: ["http://localhost:3000", "http://165.22.237.60:3000"],
      credentials: true,
    },
  },
};
