import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const cliToken = authHeader.split(" ")[1];

    const body = await req.json();
    const { projectName } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: "projectName is required." },
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

    const collection = db.collection("envs");

    // Check if project exists and user is owner
    const targetEnv = await collection.findOne({ projectName });
    
    if (!targetEnv) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    
    if (targetEnv.userId !== user._id.toString()) {
      return NextResponse.json({ error: "Cannot delete a shared project. Only the owner can delete it." }, { status: 403 });
    }

    const result = await collection.deleteOne({ _id: targetEnv._id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Project not found or could not be deleted." }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully." }, { status: 200 });

  } catch (error) {
    console.error("CLI delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
