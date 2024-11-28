import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Add error handling through promise rejection
pool.on('enqueue', () => {
  console.log('Waiting for available connection slot');
});

// Add a function to explicitly release connections
export const releaseConnection = async (connection: mysql.PoolConnection) => {
  try {
    await connection.release();
  } catch (error) {
    console.error('Error releasing connection:', error);
  }
};

export const cleanupConnections = async () => {
  try {
    await pool.end();
    console.log('All connections cleaned up');
  } catch (error) {
    console.error('Error cleaning up connections:', error);
  }
};

// Add error handling for uncaught connection errors
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled database error:', error);
});

export default pool;
