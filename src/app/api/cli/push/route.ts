import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise, { dbName } from "@/lib/connectDb";
import { encryptWithUserPin, decryptWithGlobalSecret } from "@/lib/crypto";

/**
 * POST /api/cli/push
 *
 * Secure endpoint for the `dotenvnest push` CLI command.
 * Authenticates the user with email + password (bcrypt verified),
 * then encrypts and upserts the env content for the given project.
 *
 * Body: { email, password, projectName, envContent }
 *
 * Behaviour:
 *  - Project exists (owned by user) → update envContent + lastModified
 *  - Project does not exist         → create new project document
 *  - Project exists but owned by someone else → 403 (cannot overwrite)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, projectName, envContent } = body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!email || !password || !projectName || !envContent) {
      return NextResponse.json(
        { error: "email, password, projectName and envContent are required." },
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

    if (!user.encrypted_user_secret) {
      return NextResponse.json(
        { error: "PIN setup required. Please set up your encryption PIN first." },
        { status: 403 }
      );
    }

    // ── Resolve user's PIN ───────────────────────────────────────────────────
    const rawPin = decryptWithGlobalSecret(user.encrypted_user_secret);

    // ── Encrypt the new env content ──────────────────────────────────────────
    const encryptedContent = encryptWithUserPin(envContent.trim(), rawPin);
    const now = new Date().toISOString();

    const envCollection = db.collection("envs");

    // ── Check if project already exists (owned by this user) ─────────────────
    const existing = await envCollection.findOne({
      projectName: projectName.trim(),
      userId: user._id.toString(),
    });

    if (existing) {
      // ── Project exists → UPDATE ──────────────────────────────────────────
      await envCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            envContent: encryptedContent,
            lastModified: now,
          },
        }
      );

      return NextResponse.json(
        {
          created: false,
          updated: true,
          projectName: projectName.trim(),
          message: `Project "${projectName}" updated successfully.`,
        },
        { status: 200 }
      );
    }

    // ── Check if project exists but owned by someone else ────────────────────
    const foreignProject = await envCollection.findOne({
      projectName: projectName.trim(),
    });

    if (foreignProject) {
      return NextResponse.json(
        {
          error: `Project "${projectName}" already exists and is owned by another user.`,
        },
        { status: 403 }
      );
    }

    // ── Project does not exist → CREATE ──────────────────────────────────────
    await envCollection.insertOne({
      userId: user._id.toString(),
      projectName: projectName.trim(),
      envContent: encryptedContent,
      tags: [],
      createdAt: now,
      lastModified: now,
    });

    return NextResponse.json(
      {
        created: true,
        updated: false,
        projectName: projectName.trim(),
        message: `Project "${projectName}" created successfully.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cli/push error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
