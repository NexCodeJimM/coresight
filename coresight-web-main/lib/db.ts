import mysql, {
  Pool,
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
  OkPacket,
  FieldPacket,
} from "mysql2/promise";

// Create a properly typed connection pool
const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || "143.198.84.214",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Rjmendoza21!",
  database: process.env.DB_NAME || "efi",
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

type QueryResult =
  | RowDataPacket[]
  | RowDataPacket[][]
  | OkPacket
  | OkPacket[]
  | ResultSetHeader;

export const db = {
  async query<T extends QueryResult>(
    sql: string,
    params?: any[]
  ): Promise<[T, FieldPacket[]]> {
    try {
      const [rows, fields] = await pool.query<T>(sql, params);
      return [rows, fields];
    } catch (error) {
      if (error instanceof Error) {
        console.error("Database query error:", {
          sql,
          error: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  },

  async getConnection(): Promise<PoolConnection> {
    try {
      const connection = await pool.getConnection();
      console.log("Database connection acquired");
      return connection;
    } catch (error) {
      console.error("Error getting database connection:", error);
      throw error;
    }
  },

  async testConnection(): Promise<void> {
    let connection: PoolConnection | undefined;
    try {
      connection = await this.getConnection();
      console.log(`Database connected successfully to: ${process.env.DB_NAME}`);
    } catch (error) {
      console.error("Error connecting to the database:", error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

// Test connection on startup
db.testConnection().catch((error) => {
  console.error("Initial database connection test failed:", error);
  process.exit(1);
});

// Add cleanup on process termination
process.on("SIGINT", async () => {
  try {
    await pool.end();
    console.log("Database pool closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error closing database pool:", error);
    process.exit(1);
  }
});

export default db;
