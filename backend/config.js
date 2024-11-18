module.exports = {
  db: {
    host: process.env.DB_HOST || "143.198.84.214",
    port: parseInt(process.env.DB_PORT || "3036"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "efi",
  },
  server: {
    port: parseInt(process.env.PORT || "3000"),
  },
};
