// Centralized JWT secret access. Throws on first use if neither env var is set,
// so we fail fast in production instead of silently signing tokens with a weak fallback.
let cachedSecret: Uint8Array | null = null;
let cachedRaw: string | null = null;

export function getJwtSecretRaw(): string {
  if (cachedRaw) return cachedRaw;
  const value = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      'JWT_SECRET (or NEXTAUTH_SECRET) is not set or too short (min 16 chars). Refusing to sign/verify tokens with a weak secret.'
    );
  }
  cachedRaw = value;
  return value;
}

export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  cachedSecret = new TextEncoder().encode(getJwtSecretRaw());
  return cachedSecret;
}
