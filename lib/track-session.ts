import crypto from 'crypto';
import { db } from '@/lib/db';
import { userSessions } from '@/lib/schema';
import { and, eq, lt } from 'drizzle-orm';
import { parseUserAgent } from '@/lib/user-agent';

// We don't have access to the raw NextAuth session token in API routes.
// Instead we synthesize a stable per-(user,UA-family,IP-block) key — gives
// roughly one row per (browser/device, network) and lets us refresh
// `last_active` without exploding the table.
function deriveSessionToken(userId: string, ua: string, ip: string): string {
  const uaCoarse = ua.replace(/\b\d+(\.\d+)*\b/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
  // /24 for IPv4, /48 for IPv6 — coarse enough that mobile network changes
  // within the same operator collapse to the same key.
  const ipBlock = ip.includes(':')
    ? ip.split(':').slice(0, 3).join(':')
    : ip.split('.').slice(0, 3).join('.');
  return crypto.createHash('sha256').update(`${userId}|${uaCoarse}|${ipBlock}`).digest('hex');
}

function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') || 'unknown';
}

const TOUCH_THROTTLE_MS = 5 * 60 * 1000; // upsert at most every 5 minutes per session

export async function touchUserSession(userId: string, headers: Headers): Promise<void> {
  if (!userId) return;
  const ua = headers.get('user-agent') || 'unknown';
  const ip = getClientIp(headers);
  const token = deriveSessionToken(userId, ua, ip);
  const parsed = parseUserAgent(ua);
  const now = new Date();

  try {
    const [existing] = await db
      .select({ id: userSessions.id, lastActive: userSessions.lastActive })
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.token, token)))
      .limit(1);

    if (!existing) {
      await db
        .insert(userSessions)
        .values({
          userId,
          token,
          device: parsed.device,
          location: null,
          ip,
          userAgent: ua,
          lastActive: now,
        })
        .onConflictDoNothing();
      return;
    }

    if (now.getTime() - new Date(existing.lastActive).getTime() < TOUCH_THROTTLE_MS) {
      return;
    }

    await db
      .update(userSessions)
      .set({ lastActive: now, ip, userAgent: ua, device: parsed.device })
      .where(eq(userSessions.id, existing.id));
  } catch (err) {
    console.error('[track-session] failed:', err);
  }
}

// Best-effort cleanup; call from rare admin paths if you want to trim history.
export async function pruneOldSessions(olderThan: Date): Promise<number> {
  try {
    const rows = await db.delete(userSessions).where(lt(userSessions.lastActive, olderThan)).returning({ id: userSessions.id });
    return rows.length;
  } catch {
    return 0;
  }
}

// Helper used by /api/profile/sessions to flag the row matching the current request.
export function currentSessionToken(userId: string, headers: Headers): string {
  const ua = headers.get('user-agent') || 'unknown';
  const ip = getClientIp(headers);
  return deriveSessionToken(userId, ua, ip);
}
