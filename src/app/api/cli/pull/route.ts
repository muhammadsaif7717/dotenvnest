import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";
import { decryptWithGlobalSecret, decryptWithUserPin } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const cliToken = authHeader.split(" ")[1];

    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("projectName");
    const ownerEmail = searchParams.get("ownerEmail");

    if (!projectName) {
      return NextResponse.json({ error: "projectName is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Find the current user using cliToken
    const user = await usersCollection.findOne({ cliToken });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.encrypted_user_secret) {
      return NextResponse.json({ error: "PIN setup required. Please login via website." }, { status: 403 });
    }

    const collection = db.collection("envs");
    let targetEnv = null;
    let targetPin = decryptWithGlobalSecret(user.encrypted_user_secret);

    if (ownerEmail && ownerEmail !== user.email) {
      // Pulling from a shared project
      targetEnv = await collection.findOne({
        projectName: projectName,
        "sharedWith.email": user.email
      });

      if (!targetEnv) {
        return NextResponse.json({ error: "Shared project not found." }, { status: 404 });
      }

      // Check if user has at least read access (all shares have at least read access)
      // Get owner PIN to decrypt
      const owner = await usersCollection.findOne({ _id: targetEnv.userId });
      if (!owner || !owner.encrypted_user_secret) {
        return NextResponse.json({ error: "Owner PIN not found." }, { status: 500 });
      }
      targetPin = decryptWithGlobalSecret(owner.encrypted_user_secret);
    } else {
      // Pulling own project
      targetEnv = await collection.findOne({
        userId: user._id.toString(),
        projectName: projectName
      });
    }

    if (!targetEnv) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    let rawEnvContent = "";
    try {
      rawEnvContent = decryptWithUserPin(targetEnv.envContent, targetPin);
    } catch (e) {
       console.error("Decryption failed for project", projectName);
       return NextResponse.json({ error: "Failed to decrypt environment variables." }, { status: 500 });
    }

    return NextResponse.json({ envContent: rawEnvContent }, { status: 200 });

  } catch (error) {
    console.error("CLI pull error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
