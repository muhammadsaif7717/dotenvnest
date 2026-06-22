import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";
import clientPromise, { dbName } from "@/lib/connectDb";
import { decryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = await verifyJWT(token) as any;
    
    if (!payload || !payload.userId || !payload.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = payload.email.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // "all" | "owned" | "sharedWithMe" | "sharedWithOthers"
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db(dbName);
    
    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId as string) });
    if (!user || !user.encrypted_user_secret) {
      return NextResponse.json({ error: "PIN setup required." }, { status: 403 });
    }
    
    const rawPin = decryptWithGlobalSecret(user.encrypted_user_secret);

    const collection = db.collection("envs");

    const query: any = {};

    if (type === "sharedWithMe") {
      query["sharedWith.email"] = userEmail;
    } else if (type === "sharedWithOthers") {
      query.userId = payload.userId as string;
      query["sharedWith.0"] = { $exists: true };
    } else if (type === "owned") {
      query.userId = payload.userId as string;
    } else {
      // all
      query.$or = [
        { userId: payload.userId as string },
        { "sharedWith.email": userEmail }
      ];
    }

    if (search) {
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { projectName: { $regex: search, $options: "i" } }
        ];
        delete query.$or;
      } else {
        query.projectName = { $regex: search, $options: "i" };
      }
    }

    const total = await collection.countDocuments(query);
    const hasMore = skip + limit < total;

    const envs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Cache decrypted PINs and owner emails to avoid repeated DB calls in the loop
    const userCache: Record<string, { pin: string; email: string }> = {};
    userCache[payload.userId as string] = { pin: rawPin, email: user.email };

    const decryptedEnvs = [];

    for (const env of envs) {
      let ownerInfo = userCache[env.userId];
      if (!ownerInfo) {
        const owner = await db.collection("users").findOne({ _id: new ObjectId(env.userId as string) });
        if (owner && owner.encrypted_user_secret) {
          ownerInfo = {
            pin: decryptWithGlobalSecret(owner.encrypted_user_secret),
            email: owner.email
          };
          userCache[env.userId] = ownerInfo;
        }
      }

      if (!ownerInfo) {
        decryptedEnvs.push({
          ...env,
          envContent: ""
        });
        continue;
      }

      const isShared = env.userId !== payload.userId;
      let userRole = undefined;
      if (isShared) {
        const shareEntry = env.sharedWith?.find((s: any) => s.email === userEmail);
        userRole = shareEntry?.role || "viewer";
      }

      decryptedEnvs.push({
        ...env,
        envContent: decryptWithUserPin(env.envContent, ownerInfo.pin),
        isShared,
        userRole,
        ownerEmail: isShared ? ownerInfo.email : undefined
      });
    }

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