import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";

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

    const client = await clientPromise;
    const collection = client.db(dbName).collection("envs");

    const result = await collection.insertOne({
      projectName: projectName.trim(),
      envContent: envContent.trim(),
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
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