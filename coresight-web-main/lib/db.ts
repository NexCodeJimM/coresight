import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Add connection test
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

export const db = {
  async query(sql: string, params?: any[]) {
    try {
      const connection = await pool.getConnection();
      try {
        const result = await connection.query(sql, params);
        return result;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  },
};
