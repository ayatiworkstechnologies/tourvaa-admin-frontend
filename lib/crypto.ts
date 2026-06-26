/**
 * SHA-256 hash a password using the native Web Crypto API.
 * Returns a lowercase hex string.
 * Call this on any password field before sending to the backend.
 */
export async function hashPassword(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
