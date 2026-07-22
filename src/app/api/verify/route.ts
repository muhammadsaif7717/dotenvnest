import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise, { dbName } from "@/lib/connectDb";
import { signJWT } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "User is already verified." },
        { status: 400 }
      );
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { message: "Invalid verification code." },
        { status: 400 }
      );
    }

    if (
      user.verificationCodeExpires &&
      new Date() > new Date(user.verificationCodeExpires)
    ) {
      return NextResponse.json(
        { message: "Verification code has expired." },
        { status: 400 }
      );
    }

    // Mark user as verified and remove code
    await db.collection("users").updateOne(
      { email },
      {
        $set: { isVerified: true },
        $unset: { verificationCode: "", verificationCodeExpires: "" },
      }
    );

    // Sign JWT and set cookie
    const token = await signJWT({ userId: user._id.toString(), email });

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
    console.error("[verify] error:", err);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
