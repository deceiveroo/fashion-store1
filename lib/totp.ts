// Lightweight TOTP (RFC 6238) implementation — no third-party dependency.
// Uses Node's `crypto` module which is available in API routes (Node runtime).

import crypto from 'crypto';

// Base32 RFC 4648 ----------------------------------------------------------

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx < 0) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// TOTP ---------------------------------------------------------------------

export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

function hotp(secret: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter & 0xffffffff, 4);

  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, '0');
}

export function generateTotp(secretBase32: string, opts: { step?: number; digits?: number; t?: number } = {}): string {
  const step = opts.step ?? 30;
  const digits = opts.digits ?? 6;
  const t = opts.t ?? Math.floor(Date.now() / 1000);
  const secret = base32Decode(secretBase32);
  return hotp(secret, Math.floor(t / step), digits);
}

// Verifies a 6-digit code, accepting drift of ±`window` time-steps (default 1 = ±30s).
export function verifyTotp(secretBase32: string, code: string, opts: { step?: number; digits?: number; window?: number; t?: number } = {}): boolean {
  if (!code || !/^\d{6,8}$/.test(code)) return false;
  const step = opts.step ?? 30;
  const digits = opts.digits ?? 6;
  const window = opts.window ?? 1;
  const t = opts.t ?? Math.floor(Date.now() / 1000);
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(t / step);
  for (let i = -window; i <= window; i++) {
    const expected = hotp(secret, counter + i, digits);
    // constant-time compare
    if (expected.length === code.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(code))) {
      return true;
    }
  }
  return false;
}

// Build an otpauth:// URL for QR codes.
export function buildOtpAuthUrl(opts: { issuer: string; account: string; secret: string }): string {
  const issuer = encodeURIComponent(opts.issuer);
  const account = encodeURIComponent(opts.account);
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${issuer}:${account}?${params.toString()}`;
}
