import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const BACKEND_URL = "http://165.22.237.60:3000"; // Use your backend URL

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = `${BACKEND_URL}/api/servers/${params.id}/health`;
    console.log(`Checking health from: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Health check failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to check server health:", error);
    return NextResponse.json(
      {
        error: "Failed to check server health",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
