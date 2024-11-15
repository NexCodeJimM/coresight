module.exports = {
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: [
        "http://localhost:3000",
        "http://165.22.237.60:3000",
        "http://143.198.84.214:3000",
      ],
      credentials: true,
    },
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "coresight",
    port: process.env.DB_PORT || 3306,
  },
};
