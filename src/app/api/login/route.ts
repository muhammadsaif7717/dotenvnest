import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import clientPromise, { dbName } from "@/lib/connectDb";
import { signJWT } from "@/lib/session";

// ─── POST /api/login ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Fetch the admin document matching the username
    const admin = await db.collection("admin").findOne({ username });

    if (!admin) {
      // Generic message to avoid username enumeration
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // bcrypt.compare auto-detects saltRounds=14 from the hash prefix
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signJWT({ username: admin.username });

    // Set HTTP-only session cookie (7-day expiry)
    const cookieStore = await cookies();
    cookieStore.set("envvault_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}