import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/connectDb";
import { decryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("project");

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CLI_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized CLI access" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("envs");

    const project = await collection.findOne({ projectName });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    const user = await db.collection("users").findOne({ _id: new ObjectId(project.userId as string) });
    if (!user || !user.encrypted_user_secret) {
      return NextResponse.json({ error: "User PIN not configured" }, { status: 403 });
    }
    
    const rawPin = decryptWithGlobalSecret(user.encrypted_user_secret);

    return NextResponse.json({
      projectName: project.projectName,
      envContent: decryptWithUserPin(project.envContent, rawPin),
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/cli error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
