import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "143.198.84.214",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Rjmendoza21!",
  database: process.env.DB_NAME || "efi",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Add connection test with database name logging
pool
  .getConnection()
  .then((connection) => {
    console.log(`Database connected successfully to: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

export const db = pool;
