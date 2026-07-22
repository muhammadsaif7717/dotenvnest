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

    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = (await verifyJWT(token)) as any;

    if (!payload || !payload.userId || !payload.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = payload.email.toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("envs");

    const result = await collection.updateOne({ _id: new ObjectId(id) }, {
      $pull: { sharedWith: { email: userEmail } },
    } as any);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Env not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Successfully left the shared environment." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/share/leave/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
