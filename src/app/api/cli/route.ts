import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/connectDb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectName = searchParams.get("project");

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CLI_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized CLI access" }, { status: 401 });
    }

    const client = await clientPromise;
    const collection = client.db(dbName).collection("envs");

    const project = await collection.findOne({ projectName });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      projectName: project.projectName,
      envContent: project.envContent,
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/cli error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
