import bcrypt from "bcryptjs";
import { webcrypto as nodeCrypto } from "crypto";


function ensureCrypto() {
  try {
    if (
      !globalThis.crypto ||
      typeof globalThis.crypto.getRandomValues !== "function"
    ) {
      globalThis.crypto = nodeCrypto;
    }
  } catch {
    
  }
}

// Sätt fallback ifall bcryptjs ändå inte hittar crypto
try {
  ensureCrypto();
  if (typeof bcrypt.setRandomFallback === "function") {
    bcrypt.setRandomFallback((len) => {
      const buf = new Uint8Array(len);
      globalThis.crypto.getRandomValues(buf);
      // bcryptjs förväntar sig en array av bytes
      return Array.from(buf);
    });
  }
} catch {
  
}

export async function hashPassword(plain) {
  ensureCrypto();
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  ensureCrypto();
  return bcrypt.compare(plain, hash);
}
