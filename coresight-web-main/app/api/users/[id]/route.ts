import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Update user role
    const [result] = await db.query(
      `UPDATE users 
       SET role = ?, is_admin = ?, updated_at = NOW()
       WHERE id = ?`,
      [role, role === "admin", params.id]
    );

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent deleting the last admin user
    const [adminCount] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != ?",
      [params.id]
    );

    if ((adminCount as any[])[0].count === 0) {
      return NextResponse.json(
        { error: "Cannot delete the last admin user" },
        { status: 400 }
      );
    }

    // Delete user
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [
      params.id,
    ]);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
