import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL environment variable is not set");
}

export async function GET() {
  try {
    console.log(`Fetching metrics from: ${BACKEND_URL}/api/dashboard/metrics`);
    const response = await fetch(`${BACKEND_URL}/api/dashboard/metrics`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying metrics request:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
