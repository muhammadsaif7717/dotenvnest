import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";
import {
  encryptWithGlobalSecret,
  decryptWithGlobalSecret,
  encryptWithUserPin,
  decryptWithUserPin
} from "@/lib/crypto";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentPin, newPin } = body;

    if (!currentPin || typeof currentPin !== "string" || currentPin.length !== 6 ||
        !newPin || typeof newPin !== "string" || newPin.length !== 6) {
      return NextResponse.json(
        { error: "Both current and new 6-digit PINs are required." },
        { status: 400 }
      );
    }
    
    // Check if it's exactly 6 digits
    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
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
    const envsCollection = db.collection("envs");
    
    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId as string) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (!user.encrypted_user_secret) {
      return NextResponse.json({ error: "PIN is not setup yet." }, { status: 400 });
    }

    // Verify current PIN
    const rawPin = decryptWithGlobalSecret(user.encrypted_user_secret);
    if (rawPin !== currentPin) {
      return NextResponse.json({ error: "Current PIN is incorrect." }, { status: 401 });
    }

    // Fetch all user environments
    const userEnvs = await envsCollection.find({ userId: payload.userId }).toArray();
    
    // Prepare bulk write operations for re-encryption
    const bulkOps = [];
    
    for (const env of userEnvs) {
      try {
        // Decrypt with old pin
        const decryptedContent = decryptWithUserPin(env.envContent, currentPin);
        
        // Encrypt with new pin
        const reEncryptedContent = encryptWithUserPin(decryptedContent, newPin);
        
        // Add to bulk operations
        bulkOps.push({
          updateOne: {
            filter: { _id: env._id },
            update: { $set: { envContent: reEncryptedContent } }
          }
        });
      } catch (err) {
        console.error(`Failed to re-encrypt environment ${env._id}`, err);
        return NextResponse.json({ error: "Failed to re-encrypt existing environments. Aborting PIN change." }, { status: 500 });
      }
    }

    // Encrypt the NEW PIN with the global secret
    const newEncryptedPin = encryptWithGlobalSecret(newPin);

    // Execute bulk write if there are environments
    if (bulkOps.length > 0) {
      await envsCollection.bulkWrite(bulkOps);
    }

    // Update user's pin in database
    await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId as string) },
      { $set: { encrypted_user_secret: newEncryptedPin } }
    );

    return NextResponse.json(
      { message: "PIN changed successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/user/change-pin error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
