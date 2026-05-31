import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = await verifyJWT(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const collection = client.db(dbName).collection("envs");

    const result = await collection.deleteOne({ 
      _id: new ObjectId(id),
      userId: payload.userId as string
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Env not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Env deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/delete/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}