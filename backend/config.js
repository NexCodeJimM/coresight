module.exports = {
  influxdb: {
<<<<<<< HEAD
    host: "143.198.84.214", // Replace the IP Address of the server
    port: 8086,
    org: "efi", // Replace the Organization Name
    bucket: "efi_servers_amd", // Replace the Bucket Name
    token:
      "m1glmI-4pzkHfmG0ly9xDkWEWbxZkIDbcTL8RPIAr7gO3lHNV55SvWjroCzu6YNDBqrtdXQht_KK1L9r95rTmQ==", // Replace the Token
=======
    servers: [
      {
        name: "AMD Test Server",
        host: "143.198.84.214",
        port: 8086,
        org: "efi",
        bucket: "efi_servers_amd",
        token:
          "m1glmI-4pzkHfmG0ly9xDkWEWbxZkIDbcTL8RPIAr7gO3lHNV55SvWjroCzu6YNDBqrtdXQht_KK1L9r95rTmQ==",
      },
      {
        name: "Intel Test Server",
        host: "165.22.237.60",
        port: 8086,
        org: "efi",
        bucket: "efi_servers",
        token:
          "BoKMcC-PnSb5ugtlOZvhsuuQv_eEyjYkmN8l14Zw82oohHC4pz9z2_UCsK7StvaXg-vUdMR3b_jqYThsXV6X6g==",
      },
    ],
>>>>>>> 58139a10b08f31a7486f09e35d81ed5901f50e4f
  },
  server: {
    port: 3000,
    cors: {
<<<<<<< HEAD
      // Replace the IP Address of the server and the port
      origin: ["http://localhost:3000", "http://143.198.84.214:3000"],
=======
      origin: [
        "http://localhost:3000",
        "http://165.22.237.60:3000",
        "http://143.198.84.214:3000",
      ],
>>>>>>> 58139a10b08f31a7486f09e35d81ed5901f50e4f
      credentials: true,
    },
  },
};
