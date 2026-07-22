import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import clientPromise, { dbName } from "@/lib/connectDb";
import { verifyJWT } from "@/lib/session";
import { generateOTP, sendVerificationEmail } from "@/lib/email";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;

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
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.email || !payload.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      email: newEmail,
      password: newPassword,
      oldPassword,
    } = await req.json();

    if (!oldPassword) {
      return NextResponse.json(
        { message: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json(
        { message: "No updates provided." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Verify current user
    const currentUser = await db
      .collection("users")
      .findOne({ email: payload.email as string });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(
      oldPassword,
      currentUser.password
    );
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Incorrect current password." },
        { status: 401 }
      );
    }

    const updates: Partial<{
      password: string;
      email: string;
      isVerified: boolean;
      verificationCode: string;
      verificationCodeExpires: Date;
    }> = {};
    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 14);
    }
    if (newEmail) {
      updates.email = newEmail;
      updates.isVerified = false;
      const verificationCode = generateOTP();
      updates.verificationCode = verificationCode;
      updates.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await sendVerificationEmail(newEmail, verificationCode);
    }

    // Update the user document
    const result = await db
      .collection("users")
      .updateOne({ _id: currentUser._id }, { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Delete existing session cookie to log the user out
    cookieStore.set("dotenvnest_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    // Inform client that verification is required if email changed
    const requireVerification = !!newEmail;
    return NextResponse.json(
      { success: true, email: newEmail, requireVerification },
      { status: 200 }
    );
  } catch (err) {
    console.error("[account put] error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
