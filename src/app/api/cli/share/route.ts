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
    const { projectName, email, access } = body; // access is "read" or "edit"

    if (!projectName || !email || !access) {
      return NextResponse.json(
        { error: "projectName, email, and access are required." },
        { status: 400 }
      );
    }

    const role = access === "edit" ? "editor" : "viewer";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
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

    // Check if user is trying to share with themselves
    if (email.toLowerCase() === user.email.toLowerCase()) {
       return NextResponse.json({ error: "You cannot share a project with yourself." }, { status: 400 });
    }

    const currentShares = env.sharedWith || [];
    
    // Update or add the new share
    const existingShareIndex = currentShares.findIndex((s: any) => s.email === email.toLowerCase());
    
    if (existingShareIndex >= 0) {
      currentShares[existingShareIndex].role = role;
    } else {
      currentShares.push({ email: email.toLowerCase(), role });
    }

    await collection.updateOne(
      { _id: env._id },
      { $set: { sharedWith: currentShares } }
    );

    return NextResponse.json({ message: `Successfully shared ${projectName} with ${email} as ${role}.` }, { status: 200 });

  } catch (error) {
    console.error("CLI share error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
