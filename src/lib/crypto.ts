import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// Ensure the secret is exactly 32 bytes (256 bits)
function getSecretKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length !== 32) {
    throw new Error("ENCRYPTION_SECRET must be defined in environment variables and exactly 32 characters long.");
  }
  return Buffer.from(secret, "utf8");
}

export function encrypt(text: string): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Format: iv:encryptedData
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(hash: string): string {
  // If the hash doesn't look like our encrypted format, we assume it's plain text (for backward compatibility/migration purposes)
  if (!hash || !hash.includes(":")) {
    return hash;
  }
  
  try {
    const key = getSecretKey();
    const splitIndex = hash.indexOf(":");
    if (splitIndex !== 32) {
      // The IV in hex is exactly 32 characters (16 bytes). If the first ':' is not at index 32, it's plain text.
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
    // Fallback to returning original text if decryption fails (e.g. key changed, malformed hash)
    return hash;
  }
}
