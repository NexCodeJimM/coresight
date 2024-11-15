import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch users from database with correct columns
    const [users] = await db.query(
      `SELECT 
        id,
        username,
        email,
        role,
        is_admin,
        last_login,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC`
    );

    // Transform the data to include is_active based on is_admin
    const transformedUsers = (users as any[]).map((user) => ({
      ...user,
      is_active: Boolean(user.is_admin), // Use is_admin as a proxy for is_active
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { username, email, password, role } = data;

    // Add validation here
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert new user with correct columns
    const [result] = await db.query(
      `INSERT INTO users (
        username, 
        email, 
        password, 
        role,
        is_admin
      ) VALUES (?, ?, ?, ?, ?)`,
      [username, email, password, role, role === "admin" ? 1 : 0]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
