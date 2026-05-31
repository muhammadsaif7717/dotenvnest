import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";
import { encryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

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
    
    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId as string) });
    if (!user || !user.encrypted_user_secret) {
      return NextResponse.json({ error: "PIN setup required." }, { status: 403 });
    }
    
    const rawPin = decryptWithGlobalSecret(user.encrypted_user_secret);

    const collection = db.collection("envs");

    const result = await collection.updateOne(
      { _id: new ObjectId(id), userId: payload.userId as string },
      {
        $set: {
          projectName: projectName.trim(),
          envContent: encryptWithUserPin(envContent.trim(), rawPin),
          tags: Array.isArray(tags) ? tags : [],
          lastModified: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Env not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Env updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/update/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}