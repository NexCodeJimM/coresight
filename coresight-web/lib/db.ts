import mysql from "mysql2/promise";
import { PoolOptions } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  connectTimeout: 10000,
};

const pool = mysql.createPool(poolConfig);

// Test the connection
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connected successfully");
    connection.release();
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

export default pool;
