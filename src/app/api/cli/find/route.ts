import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/connectDb";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const cliToken = authHeader.split(" ")[1];

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase() || "";

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    // Find the current user using cliToken
    const user = await usersCollection.findOne({ cliToken });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = db.collection("envs");

    // Get owned projects
    const ownedProjectsCursor = await collection
      .find({ userId: user._id.toString() })
      .toArray();

    // Get shared projects
    const sharedProjectsCursor = await collection
      .find({ "sharedWith.email": user.email })
      .toArray();

    let ownedProjects = ownedProjectsCursor.map((env) => ({
      name: env.projectName,
      type: "owned",
      sharedWith: env.sharedWith ? env.sharedWith.map((s: any) => s.email) : [],
    }));

    // We need to fetch owner email for shared projects
    const ownerIds = [
      ...new Set(sharedProjectsCursor.map((env) => env.userId)),
    ];
    const objectIds = ownerIds
      .map((id) => {
        try {
          return new ObjectId(id as string);
        } catch (e) {
          return null;
        }
      })
      .filter((id) => id !== null);
    const owners = await usersCollection
      .find({ _id: { $in: objectIds } })
      .toArray();
    const ownerMap = owners.reduce(
      (acc, owner) => {
        acc[owner._id.toString()] = owner.email;
        return acc;
      },
      {} as Record<string, string>
    );

    let sharedProjects = sharedProjectsCursor.map((env) => ({
      name: env.projectName,
      type: "shared",
      owner: ownerMap[env.userId] || "Unknown",
    }));

    if (query) {
      ownedProjects = ownedProjects.filter((p) =>
        p.name.toLowerCase().includes(query)
      );
      sharedProjects = sharedProjects.filter((p) =>
        p.name.toLowerCase().includes(query)
      );
    }

    return NextResponse.json(
      { ownedProjects, sharedProjects },
      { status: 200 }
    );
  } catch (error) {
    console.error("CLI find error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
