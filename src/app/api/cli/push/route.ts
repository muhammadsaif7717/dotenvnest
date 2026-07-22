import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";
import { encryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const cliToken = authHeader.split(" ")[1];

    const body = await req.json();
    const { projectName, envContent, ownerEmail } = body;

    if (!projectName || !envContent) {
      return NextResponse.json(
        { error: "projectName and envContent are required." },
        { status: 400 }
      );
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
      // Trying to push to a shared project
      targetEnv = await collection.findOne({
        projectName: projectName,
        "sharedWith.email": user.email
      });

      if (!targetEnv) {
        return NextResponse.json({ error: "Shared project not found." }, { status: 404 });
      }

      // Check if user has edit access
      const share = targetEnv.sharedWith.find((s: any) => s.email === user.email);
      if (!share || share.role !== "editor") {
        return NextResponse.json({ error: "You only have read access to this shared project." }, { status: 403 });
      }

      // We need the owner's PIN to encrypt the content for their project
      const owner = await usersCollection.findOne({ _id: targetEnv.userId });
      if (!owner || !owner.encrypted_user_secret) {
        return NextResponse.json({ error: "Owner PIN not found." }, { status: 500 });
      }
      targetPin = decryptWithGlobalSecret(owner.encrypted_user_secret);
    } else {
      // Pushing to own project
      targetEnv = await collection.findOne({
        userId: user._id.toString(),
        projectName: projectName
      });
    }

    const encryptedContent = encryptWithUserPin(envContent.trim(), targetPin);

    if (targetEnv) {
      // Update existing
      await collection.updateOne(
        { _id: targetEnv._id },
        { 
          $set: { 
            envContent: encryptedContent,
            lastModified: new Date().toISOString()
          } 
        }
      );
      return NextResponse.json({ message: "Environment updated successfully." }, { status: 200 });
    } else {
      // Create new
      if (ownerEmail && ownerEmail !== user.email) {
         return NextResponse.json({ error: "Cannot create a new shared project. Ask the owner to create and share it." }, { status: 403 });
      }
      await collection.insertOne({
        userId: user._id.toString(),
        projectName: projectName.trim(),
        envContent: encryptedContent,
        tags: [],
        sharedWith: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
      return NextResponse.json({ message: "Environment created successfully." }, { status: 201 });
    }

  } catch (error) {
    console.error("CLI push error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
