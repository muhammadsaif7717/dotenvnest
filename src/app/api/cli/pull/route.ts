import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise, { dbName } from "@/lib/connectDb";
import { decryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";

/**
 * POST /api/cli/pull
 *
 * Secure endpoint for the `dotenvnest pull` CLI command.
 * Authenticates the user with email + password (bcrypt verified),
 * then decrypts and returns the requested project's env content.
 *
 * Body: { email, password, projectName }
 *
 * Security layers:
 *  1. Email must exist and be verified in DB
 *  2. Password verified with bcrypt
 *  3. Project must be owned by (or shared with) that user
 *  4. Env content decrypted using the user's PIN (AES-256-CBC)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, projectName } = body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!email || !password || !projectName) {
      return NextResponse.json(
        { error: "email, password and projectName are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // ── Find & verify user ───────────────────────────────────────────────────
    const user = await db.collection("users").findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      // Return generic message to prevent email enumeration
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Account email is not verified. Please verify your email first." },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // ── Find project (owned or shared with editor/viewer access) ─────────────
    const envCollection = db.collection("envs");

    // Try owned project first
    let project = await envCollection.findOne({
      projectName: projectName.trim(),
      userId: user._id.toString(),
    });

    // If not owned, check shared access
    if (!project) {
      project = await envCollection.findOne({
        projectName: projectName.trim(),
        "sharedWith.email": email.trim().toLowerCase(),
      });
    }

    if (!project) {
      return NextResponse.json(
        { error: `Project "${projectName}" not found or you don't have access.` },
        { status: 404 }
      );
    }

    // ── Resolve the PIN of the project OWNER (not the shared user) ───────────
    let ownerUser = user;
    if (project.userId !== user._id.toString()) {
      // Shared project — need to get the owner's PIN
      const { ObjectId } = await import("mongodb");
      ownerUser = await db
        .collection("users")
        .findOne({ _id: new ObjectId(project.userId as string) }) as typeof user;

      if (!ownerUser) {
        return NextResponse.json(
          { error: "Project owner not found." },
          { status: 500 }
        );
      }
    }

    if (!ownerUser.encrypted_user_secret) {
      return NextResponse.json(
        { error: "Project owner has not set up their encryption PIN yet." },
        { status: 403 }
      );
    }

    // ── Decrypt and return ───────────────────────────────────────────────────
    const rawPin = decryptWithGlobalSecret(ownerUser.encrypted_user_secret);
    const decryptedContent = decryptWithUserPin(project.envContent, rawPin);

    return NextResponse.json(
      {
        projectName: project.projectName,
        envContent: decryptedContent,
        keyCount: decryptedContent
          .split("\n")
          .filter(
            (l: string) =>
              l.trim() && !l.trim().startsWith("#") && l.includes("=")
          ).length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/cli/pull error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
