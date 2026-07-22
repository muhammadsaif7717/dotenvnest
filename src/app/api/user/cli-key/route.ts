import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/session";

/**
 * GET /api/user/cli-key
 * Returns the server's CLI_SECRET to authenticated users.
 * This is the value they must set as DOTENVNEST_API_KEY in their shell.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("dotenvnest_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cliSecret = process.env.CLI_SECRET;
    if (!cliSecret) {
      return NextResponse.json(
        { message: "CLI_SECRET is not configured on this server." },
        { status: 503 }
      );
    }

    return NextResponse.json({ apiKey: cliSecret }, { status: 200 });
  } catch (err) {
    console.error("[cli-key] error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
