<<<<<<< HEAD
const config = {
  development: {
    port: 3000,
    influxdb: {
      url: "http://165.22.237.60:8086",
      org: "EFI",
      bucket: "efi_servers",
    },
=======
module.exports = {
  influxdb: {
    host: "efi",
    database: "efi_servers",
    username: "jimm", // if required
    password: "Rjmendoza21!", // if required
>>>>>>> 1bc549df51a320173444029819002cc56411d381
  },
  server: {
    port: 3000,
    cors: {
      origin: ["http://localhost:3000", "http://165.22.237.60:3000"],
      credentials: true,
    },
  },
};
