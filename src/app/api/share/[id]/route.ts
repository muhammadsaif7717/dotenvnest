import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const body = await req.json();
    const { sharedWith } = body;

    // sharedWith should be an array of { email: string, role: "viewer" | "editor" }
    if (!Array.isArray(sharedWith)) {
      return NextResponse.json(
        { error: "sharedWith must be an array." },
        { status: 400 }
      );
    }

    // Validate email format and roles
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const item of sharedWith) {
      if (!item.email || !emailRegex.test(item.email)) {
        return NextResponse.json(
          { error: `Invalid email format: ${item.email || "empty"}` },
          { status: 400 }
        );
      }
      if (item.role !== "viewer" && item.role !== "editor") {
        return NextResponse.json(
          { error: `Invalid role: ${item.role} for email ${item.email}` },
          { status: 400 }
        );
      }
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = await verifyJWT(token) as any;

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("envs");

    // Fetch the env project
    const env = await collection.findOne({ _id: new ObjectId(id) });
    if (!env) {
      return NextResponse.json({ error: "Env not found." }, { status: 404 });
    }

    // Only the owner can manage sharing
    if (env.userId !== payload.userId) {
      return NextResponse.json(
        { error: "Only the owner can share this env." },
        { status: 403 }
      );
    }

    // Update sharedWith array
    // Normalize emails to lowercase for consistency
    const normalizedSharedWith = sharedWith.map((item) => ({
      email: item.email.toLowerCase().trim(),
      role: item.role,
    }));

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { sharedWith: normalizedSharedWith } }
    );

    return NextResponse.json(
      { message: "Share list updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/share/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
