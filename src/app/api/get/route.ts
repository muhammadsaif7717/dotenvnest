import { NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const collection = client.db(dbName).collection("envs");

    const envs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(envs, { status: 200 });
  } catch (error) {
    console.error("GET /api/get error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}