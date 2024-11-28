import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reCAPTCHA" },
        { status: 400 }
      );
    }

    // You can also check the score if needed
    if (data.score < 0.5) {
      return NextResponse.json(
        { success: false, error: "Suspicious activity detected" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify reCAPTCHA" },
      { status: 500 }
    );
  }
} 