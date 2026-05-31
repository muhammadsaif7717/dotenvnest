import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";
import { generateOTP, sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) { console.log("RESEND CODE HIT");
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (user.isVerified) {
      return NextResponse.json({ message: "User already verified" }, { status: 400 });
    }

    const verificationCode = generateOTP();
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { verificationCode, verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000) } }
    );
    await sendVerificationEmail(email, verificationCode);

    return NextResponse.json({ success: true, message: "Verification code resent" }, { status: 200 });
  } catch (err) {
    console.error("[resend-code] error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
