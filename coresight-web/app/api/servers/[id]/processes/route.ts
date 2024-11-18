import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Get server details to check if it exists
    const [servers] = await pool.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (!(servers as any[]).length) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Get current processes
    const [processes] = await pool.query(
      `SELECT * FROM server_processes 
       WHERE server_id = ? 
       ORDER BY cpu_usage DESC 
       LIMIT 50`, // Limit to top 50 processes by CPU usage
      [id]
    );

    return NextResponse.json({
      success: true,
      data: processes,
    });
  } catch (error) {
    console.error("Error fetching server processes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch server processes",
        details: error,
      },
      { status: 500 }
    );
  }
}
