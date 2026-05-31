import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";
import { encryptWithGlobalSecret } from "@/lib/crypto";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return NextResponse.json(
        { error: "A 6-digit PIN is required." },
        { status: 400 }
      );
    }
    
    // Check if it's exactly 6 digits
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = await verifyJWT(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId as string) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (user.encrypted_user_secret) {
      return NextResponse.json({ error: "PIN is already setup." }, { status: 400 });
    }

    // Encrypt the PIN with the global secret
    const encryptedPin = encryptWithGlobalSecret(pin);

    // Save to user document
    await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId as string) },
      { $set: { encrypted_user_secret: encryptedPin } }
    );

    return NextResponse.json(
      { message: "PIN set successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/user/setup-pin error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
