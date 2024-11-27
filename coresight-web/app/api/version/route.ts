import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const versionPath = path.join(process.cwd(), '.version');
    const version = fs.existsSync(versionPath) 
      ? fs.readFileSync(versionPath, 'utf8').trim()
      : '0.0.0';

    return NextResponse.json({
      success: true,
      version,
      update_available: false // Will be set by the update check service
    });
  } catch (error) {
    console.error("Error getting version:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get version" },
      { status: 500 }
    );
  }
} 