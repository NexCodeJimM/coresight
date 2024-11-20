import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ServerRow extends RowDataPacket {
  id: string;
  name: string;
  ip_address: string;
  hostname: string;
  description: string;
  status: string;
  current_status: string;
  last_seen: Date;
  uptime: number;
  org: string | null;
  bucket: string | null;
  token: string | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function queryWithRetry(
  query: string,
  params: (string | number | null)[],
  retries = MAX_RETRIES
): Promise<ServerRow[]> {
  try {
    const [rows] = await pool.query<ServerRow[]>(query, params);
    return rows;
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.code === "ETIMEDOUT" && retries > 0) {
      console.log(
        `Database query timed out, retrying... (${retries} attempts left)`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return queryWithRetry(query, params, retries - 1);
    }
    throw error;
  }
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

    try {
      const servers = await queryWithRetry(
        `SELECT 
          s.*,
          s.org,
          s.bucket,
          s.token,
          su.status as current_status,
          su.last_checked as last_seen,
          su.uptime
        FROM servers s
        LEFT JOIN server_uptime su ON s.id = su.server_id
        WHERE s.id = ?`,
        [id]
      );

      if (!servers || servers.length === 0) {
        return NextResponse.json(
          { success: false, error: "Server not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        server: servers[0],
      });
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in server details API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch server details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const {
      name,
      description,
      hostname,
      ip_address,
      port,
      org,
      bucket,
      token,
    } = await req.json();

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE servers 
       SET name = ?, 
           description = ?,
           hostname = ?,
           ip_address = ?,
           port = ?,
           org = ?,
           bucket = ?,
           token = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, description, hostname, ip_address, port, org, bucket, token, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Server not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Server updated successfully",
    });
  } catch (error) {
    console.error("Error updating server:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update server",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Delete related records
      await connection.execute(
        "DELETE FROM server_uptime WHERE server_id = ?",
        [id]
      );
      await connection.execute(
        "DELETE FROM server_processes WHERE server_id = ?",
        [id]
      );
      await connection.execute(
        "DELETE FROM server_metrics WHERE server_id = ?",
        [id]
      );
      await connection.execute("DELETE FROM alerts WHERE server_id = ?", [id]);
      await connection.execute(
        "DELETE FROM server_actions WHERE server_id = ?",
        [id]
      );

      // Delete the server
      await connection.execute("DELETE FROM servers WHERE id = ?", [id]);
      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Server deleted successfully",
      });
    } catch (error) {
      await connection.rollback();
      console.error("Database error during deletion:", error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting server:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete server",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
