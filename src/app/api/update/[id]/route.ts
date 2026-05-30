import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/connectDb";

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
    const { projectName, envContent } = body;

    if (!projectName || !envContent) {
      return NextResponse.json(
        { error: "projectName and envContent are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const collection = client.db(dbName).collection("envs");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          projectName: projectName.trim(),
          envContent: envContent.trim(),
          updatedAt: new Date().toISOString(),
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