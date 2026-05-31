import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = await verifyJWT(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const collection = client.db(dbName).collection("envs");

    const query = { userId: payload.userId as string };

    const total = await collection.countDocuments(query);
    const hasMore = skip + limit < total;

    const envs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const decryptedEnvs = envs.map(env => ({
      ...env,
      envContent: decrypt(env.envContent)
    }));

    return NextResponse.json({
      data: decryptedEnvs,
      page,
      limit,
      total,
      hasMore
    }, { status: 200 });
  } catch (error) {
    console.error("GET /api/get error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}