import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ProcessRow extends RowDataPacket {
  id: string;
  server_id: string;
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

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

    // Get processes with disk usage
    const [processesRows] = await pool.query<ProcessRow[]>(
      `SELECT * FROM server_processes 
       WHERE server_id = ? 
       ORDER BY cpu_usage DESC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: processesRows,
    });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch processes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
