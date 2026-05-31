import { SignJWT, jwtVerify } from "jose";

const SESSION_SECRET = process.env.SESSION_SECRET || "envvault-secret";
const encodedKey = new TextEncoder().encode(SESSION_SECRET);

export async function signJWT(payload: { userId: string; email: string; [key: string]: unknown }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifyJWT(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
