import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MongoClient, ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/session";

const generateSecureToken = () => {
  return require("crypto").randomBytes(32).toString("hex");
};

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;
    const payload = await verifyJWT(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 500 });
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db("dotenvnest");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId as string) });
    if (!user) {
      await client.close();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.encrypted_user_secret) {
      await client.close();
      return NextResponse.json({ error: "Please set up your encryption PIN first." }, { status: 403 });
    }

    const cliToken = user.cliToken || generateSecureToken();

    if (!user.cliToken) {
      await usersCollection.updateOne({ _id: user._id }, { $set: { cliToken } });
    }

    await client.close();

    return NextResponse.json({ token: cliToken }, { status: 200 });
  } catch (error) {
    console.error("CLI auth token error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
