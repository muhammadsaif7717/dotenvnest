import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// Gets the global secret key (used to encrypt the user's PIN in the DB)
function getGlobalSecretKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 32) {
    throw new Error(
      "ENCRYPTION_SECRET must be defined in environment variables and exactly 32 characters long."
    );
  }
  return Buffer.from(secret, "utf8");
}

// Derives a 32-byte key from a 6-digit PIN (used to encrypt user's actual data)
function getUserSecretKey(pin: string) {
  if (!pin || pin.length < 6) {
    throw new Error("A valid PIN is required for encryption.");
  }
  // Use SHA-256 to hash the PIN to exactly 32 bytes for aes-256-cbc
  return crypto.createHash("sha256").update(pin).digest();
}

/**
 * Encrypts data using the global environment secret.
 * Used for encrypting the user's PIN before storing it in the database.
 */
export function encryptWithGlobalSecret(text: string): string {
  const key = getGlobalSecretKey();
  return _encrypt(text, key);
}

/**
 * Decrypts data using the global environment secret.
 * Used for decrypting the user's PIN from the database.
 */
export function decryptWithGlobalSecret(hash: string): string {
  const key = getGlobalSecretKey();
  return _decrypt(hash, key);
}

/**
 * Encrypts data using a derived key from the user's PIN.
 * Used for encrypting .env files.
 */
export function encryptWithUserPin(text: string, pin: string): string {
  const key = getUserSecretKey(pin);
  return _encrypt(text, key);
}

/**
 * Decrypts data using a derived key from the user's PIN.
 * Used for decrypting .env files.
 */
export function decryptWithUserPin(hash: string, pin: string): string {
  const key = getUserSecretKey(pin);
  return _decrypt(hash, key);
}

// Internal helper for encryption
function _encrypt(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

// Internal helper for decryption
function _decrypt(hash: string, key: Buffer): string {
  if (!hash || !hash.includes(":")) {
    return hash;
  }

  try {
    const splitIndex = hash.indexOf(":");
    if (splitIndex !== 32) {
      return hash;
    }

    const ivHex = hash.substring(0, 32);
    const encryptedHex = hash.substring(33);
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(
      "Decryption failed. The provided key might be incorrect or the data is corrupted."
    );
  }
}
