import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import clientPromise, { dbName } from "@/lib/connectDb";
import { signJWT, verifyJWT } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("envvault_session")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const payload = await verifyJWT(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ email: payload.email }, { status: 200 });
  } catch (err) {
    console.error("[account get] error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("envvault_session")?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const payload = await verifyJWT(token);
    if (!payload || !payload.email || !payload.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email: newEmail, password: newPassword, oldPassword } = await req.json();

    if (!newEmail || !newPassword || !oldPassword) {
      return NextResponse.json(
        { message: "Email, new password, and current password are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Verify current user
    const currentUser = await db.collection("users").findOne({ email: payload.email as string });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, currentUser.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Incorrect current password." }, { status: 401 });
    }

    // Hash the new password with saltRounds=14 to match the rest of the app
    const hashedPassword = await bcrypt.hash(newPassword, 14);

    // Update the user document
    const result = await db.collection("users").updateOne(
      { _id: currentUser._id },
      { $set: { email: newEmail, password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Generate new JWT token with updated email
    const newToken = await signJWT({ userId: currentUser._id.toString(), email: newEmail });

    // Set HTTP-only session cookie (7-day expiry)
    cookieStore.set("envvault_session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true, email: newEmail }, { status: 200 });
  } catch (err) {
    console.error("[account put] error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
