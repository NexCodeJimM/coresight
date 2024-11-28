import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { generateTOTP, verifyTOTP } from "@epic-web/totp";
import QRCode from "qrcode";

interface User2FARow extends RowDataPacket {
  email: string;
  temp_2fa_secret: string | null;
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
}

// Generate 2FA secret and QR code
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.id !== params.id && !session.user.is_admin)) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get user email
    const [users] = await pool.query<User2FARow[]>(
      "SELECT email FROM users WHERE id = ?",
      [params.id]
    );

    if (!users.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate TOTP secret
    const totpData = await generateTOTP();
    const uri = `otpauth://totp/CoreSight:${users[0].email}?secret=${totpData.secret}&issuer=CoreSight`;

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(uri);

    // Store temporary secret in database
    await pool.query(
      `UPDATE users 
       SET temp_2fa_secret = ? 
       WHERE id = ?`,
      [totpData.secret, params.id]
    );

    return NextResponse.json({
      success: true,
      qrCode: qrCodeUrl,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return NextResponse.json(
      { success: false, error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}

// Verify and enable 2FA
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.id !== params.id && !session.user.is_admin)) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { otp } = await req.json();

    // Get user's temporary secret
    const [users] = await pool.query<User2FARow[]>(
      "SELECT temp_2fa_secret FROM users WHERE id = ?",
      [params.id]
    );

    if (!users.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const tempSecret = users[0].temp_2fa_secret;
    if (!tempSecret) {
      return NextResponse.json(
        { success: false, error: "No 2FA setup in progress" },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = await verifyTOTP({
      secret: tempSecret,
      otp: otp,
      window: 1, // Allow 1 step before/after for time drift
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable 2FA
    await pool.query(
      `UPDATE users 
       SET two_factor_secret = temp_2fa_secret,
           temp_2fa_secret = NULL,
           two_factor_enabled = 1
       WHERE id = ?`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify 2FA" },
      { status: 500 }
    );
  }
}

// Disable 2FA
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.id !== params.id && !session.user.is_admin)) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await pool.query(
      `UPDATE users 
       SET two_factor_secret = NULL,
           temp_2fa_secret = NULL,
           two_factor_enabled = 0
       WHERE id = ?`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disable 2FA" },
      { status: 500 }
    );
  }
} 