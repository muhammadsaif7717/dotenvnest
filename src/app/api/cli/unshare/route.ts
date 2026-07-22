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
    const { projectName, email } = body;

    if (!projectName || !email) {
      return NextResponse.json(
        { error: "projectName and email are required." },
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
    
    // Find the project owned by the user
    const env = await collection.findOne({
      userId: user._id.toString(),
      projectName: projectName.trim()
    });

    if (!env) {
      return NextResponse.json({ error: "Project not found or you don't own it." }, { status: 404 });
    }

    const currentShares = env.sharedWith || [];
    const newShares = currentShares.filter((s: any) => s.email !== email.toLowerCase());

    if (newShares.length === currentShares.length) {
       return NextResponse.json({ error: `${email} does not have access to this project.` }, { status: 400 });
    }

    await collection.updateOne(
      { _id: env._id },
      { $set: { sharedWith: newShares } }
    );

    return NextResponse.json({ message: `Successfully removed access for ${email}.` }, { status: 200 });

  } catch (error) {
    console.error("CLI unshare error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
