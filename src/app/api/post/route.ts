import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";
import { encryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, envContent, tags = [] } = body;

    if (!projectName || !envContent) {
      return NextResponse.json(
        { error: "projectName and envContent are required." },
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

    // Fetch the user to get their encrypted secret
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(payload.userId as string) });
    if (!user || !user.encrypted_user_secret) {
      return NextResponse.json(
        { error: "PIN setup required." },
        { status: 403 }
      );
    }

    // Decrypt the PIN using the global secret
    const rawPin = decryptWithGlobalSecret(user.encrypted_user_secret);

    const collection = db.collection("envs");

    const result = await collection.insertOne({
      userId: payload.userId,
      projectName: projectName.trim(),
      envContent: encryptWithUserPin(envContent.trim(), rawPin),
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Env saved successfully.", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/post error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
