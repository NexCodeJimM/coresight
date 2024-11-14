module.exports = {
  influxdb: {
    host: "143.198.84.214", // Replace the IP Address of the server
    port: 8086,
    org: "efi", // Replace the Organization Name
    bucket: "efi_servers_amd", // Replace the Bucket Name
    token:
      "m1glmI-4pzkHfmG0ly9xDkWEWbxZkIDbcTL8RPIAr7gO3lHNV55SvWjroCzu6YNDBqrtdXQht_KK1L9r95rTmQ==", // Replace the Token
  },
  server: {
    port: 3000,
    cors: {
      // Replace the IP Address of the server and the port
      origin: ["http://localhost:3000", "http://143.198.84.214:3000"],
      credentials: true,
    },
  },
};
