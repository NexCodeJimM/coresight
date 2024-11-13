module.exports = {
  influxdb: {
    host: "165.22.237.60", // Replace the IP Address of the server
    port: 8086,
    org: "efi", // Replace the Organization Name
    bucket: "efi_servers", // Replace the Bucket Name
    token:
      "BoKMcC-PnSb5ugtlOZvhsuuQv_eEyjYkmN8l14Zw82oohHC4pz9z2_UCsK7StvaXg-vUdMR3b_jqYThsXV6X6g==", // Replace the Token
  },
  server: {
    port: 3000,
    cors: {
      // Replace the IP Address of the server and the port
      origin: ["http://localhost:3000", "http://165.22.237.60:3000"],
      credentials: true,
    },
  },
};
