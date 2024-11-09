import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = {
  query: async (query: string, values: any[] = []) => {
    try {
      const [rows] = await pool.execute(query, values);
      return [rows];
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  },
};
