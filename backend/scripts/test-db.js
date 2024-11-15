require("dotenv").config();
const mysql = require("mysql2/promise");

async function testDatabase() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Successfully connected to database");

    // Test server creation
    const testServer = {
      name: "Test Server",
      hostname: "test-server",
      ip_address: "192.168.1.100",
      port: 8086,
      org: "test-org",
      bucket: "test-bucket",
      token: "test-token",
    };

    // Insert test server
    const [result] = await connection.execute(
      `INSERT INTO servers 
       (id, name, hostname, ip_address, port, org, bucket, token) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        testServer.name,
        testServer.hostname,
        testServer.ip_address,
        testServer.port,
        testServer.org,
        testServer.bucket,
        testServer.token,
      ]
    );

    console.log("Test server created:", result);

    // Fetch the created server
    const [servers] = await connection.execute(
      "SELECT * FROM servers WHERE name = ?",
      [testServer.name]
    );

    console.log("Retrieved server:", servers[0]);

    // Clean up test data
    await connection.execute("DELETE FROM servers WHERE name = ?", [
      testServer.name,
    ]);

    console.log("Test data cleaned up");
    await connection.end();
  } catch (error) {
    console.error("Database test failed:", error);
    process.exit(1);
  }
}

testDatabase();
