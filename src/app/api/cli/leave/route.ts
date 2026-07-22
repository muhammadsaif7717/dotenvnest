import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";

export async function POST(req: NextRequest) {
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

    // Find the project that is shared with this user
    const targetEnv = await collection.findOne({ 
      projectName,
      "sharedWith.email": user.email
    });
    
    if (!targetEnv) {
      return NextResponse.json({ error: "Shared project not found or you don't have access to it." }, { status: 404 });
    }
    
    if (targetEnv.userId === user._id.toString()) {
      return NextResponse.json({ error: "You are the owner of this project. Use 'del' to delete it." }, { status: 400 });
    }

    // Remove the user from the sharedWith array
    const result = await collection.updateOne(
      { _id: targetEnv._id },
      { $pull: { sharedWith: { email: user.email } } as any }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Could not remove you from the project." }, { status: 500 });
    }

    return NextResponse.json({ message: `Successfully left the project ${projectName}.` }, { status: 200 });

  } catch (error) {
    console.error("CLI leave error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
