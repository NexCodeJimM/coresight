import mysql, {
  Pool,
  PoolConnection,
  RowDataPacket,
  ResultSetHeader,
  OkPacket,
  FieldPacket,
  PoolOptions,
} from "mysql2/promise";

// Create a single pool instance that will be reused
let pool: Pool | null = null;

interface DatabaseError extends Error {
  code?: string;
}

// Function to get or create the pool
function getPool(): Pool {
  if (!pool) {
    const poolConfig: PoolOptions = {
      host: process.env.DB_HOST || "143.198.84.214",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Rjmendoza21!",
      database: process.env.DB_NAME || "efi",
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      idleTimeout: 30000,
      maxIdle: 1,
    };

    pool = mysql.createPool(poolConfig);

    // Handle pool errors
    pool.on("connection", (connection) => {
      connection.on("error", (err: DatabaseError) => {
        console.error("Database connection error:", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
          pool = null;
        }
      });
    });
  }
  return pool;
}

// Add delay function with exponential backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getRetryDelay = (attempt: number) =>
  Math.min(100 * Math.pow(2, attempt), 2000);

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
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
          const [rows, fields] = await connection.query<T>(sql, params);
          return [rows, fields];
        } finally {
          connection.release();
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof Error &&
          error.message.includes("Too many connections")
        ) {
          const delay = getRetryDelay(attempt);
          console.log(
            `Connection attempt ${attempt}/${maxRetries}, waiting ${delay}ms...`
          );
          await sleep(delay);

          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw new Error(
              `Failed to connect after ${maxRetries} attempts: ${error.message}`
            );
          }
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error("Failed after max retries");
  },

  async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    let connection: PoolConnection | undefined;
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const pool = getPool();
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
      } catch (error) {
        if (connection) {
          await connection.rollback();
        }
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof Error &&
          error.message.includes("Too many connections")
        ) {
          const delay = getRetryDelay(attempt);
          console.log(
            `Transaction attempt ${attempt}/${maxRetries}, waiting ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }
        throw error;
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }

    throw lastError || new Error("Failed after max retries");
  },

  async closePool(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
    }
  },
};

// Handle cleanup on process termination
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, closing database pool...`);
    try {
      await db.closePool();
      console.log("Database pool closed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Error closing database pool:", error);
      process.exit(1);
    }
  });
});

export default db;
