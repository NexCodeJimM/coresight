module.exports = {
  influxdb: {
    host: "165.22.237.60",
    port: 8086,
    org: "efi",
    bucket: "efi_servers",
    token:
      "BoKMcC-PnSb5ugtlOZvhsuuQv_eEyjYkmN8l14Zw82oohHC4pz9z2_UCsK7StvaXg-vUdMR3b_jqYThsXV6X6g==",
  },
  server: {
    port: 3000,
    cors: {
      origin: ["http://localhost:3000", "http://165.22.237.60:3000"],
      credentials: true,
    },
  },
};
