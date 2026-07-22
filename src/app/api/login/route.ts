import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import clientPromise, { dbName } from "@/lib/connectDb";
import { signJWT } from "@/lib/session";
import { generateOTP, sendVerificationEmail } from "@/lib/email";

// ─── POST /api/login ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Fetch the user document matching the email
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      // Generic message to avoid username enumeration
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    if (user.isVerified === false) {
      const verificationCode = generateOTP();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      await db
        .collection("users")
        .updateOne(
          { email },
          { $set: { verificationCode, verificationCodeExpires } }
        );

      await sendVerificationEmail(email, verificationCode);

      return NextResponse.json(
        {
          message: "Please verify your email first. A new code has been sent.",
          requireVerification: true,
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
    });

    // Set HTTP-only session cookie (7-day expiry)
    const cookieStore = await cookies();
    cookieStore.set("dotenvnest_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
