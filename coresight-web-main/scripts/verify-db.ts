import { db } from "../lib/db";
import { hash } from "bcrypt";

async function verifyDatabase() {
  try {
    // Test connection
    const [result] = await db.query("SELECT 1");
    console.log("Database connection successful");

    // Check if admin user exists
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      "efi_admin@test.com",
    ]);
    console.log("Existing users:", users);

    // If admin doesn't exist, create it
    if (!(users as any[]).length) {
      const hashedPassword = await hash("*7eL£~0YV&9h", 10);
      await db.query(
        `INSERT INTO users (id, username, email, password, role, is_admin) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "default-admin-id",
          "efi_admin",
          "efi_admin@test.com",
          hashedPassword,
          "admin",
          true,
        ]
      );
      console.log("Admin user created");
    }
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

verifyDatabase();
