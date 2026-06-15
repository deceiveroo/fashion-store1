// Lightweight AI usage analytics, stored as a single JSON blob in `settings`
// (key: ai_usage_stats) so it needs no new table / migration.
//
// We keep per-day counters for the last N days plus running latency totals so
// the admin panel can show "сколько обработал ИИ", "% фолбэка", "эскалации",
// "ошибки", and "средняя скорость ответа". Writes are best-effort and must
// never break the chat path — callers fire-and-forget.

import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const STATS_KEY = 'ai_usage_stats';
const RETENTION_DAYS = 30;

export type AiStatEvent = 'answered' | 'fallback' | 'escalated' | 'error';

interface DayStat {
  answered: number;   // AI produced the reply
  fallback: number;   // fell back to keyword auto-responder
  escalated: number;  // handed off to a human operator
  error: number;      // generation threw / provider failure surfaced
  latencyMs: number;  // summed latency for answered+escalated replies
  latencyN: number;   // count of latency samples (for averaging)
}

type StatsBlob = Record<string, DayStat>; // keyed by YYYY-MM-DD

function emptyDay(): DayStat {
  return { answered: 0, fallback: 0, escalated: 0, error: 0, latencyMs: 0, latencyN: 0 };
}

function todayKey(): string {
  // Server-local date is fine for coarse daily buckets.
  return new Date().toISOString().slice(0, 10);
}

async function readBlob(): Promise<StatsBlob> {
  const [row] = await db.select().from(settings).where(eq(settings.key, STATS_KEY)).limit(1);
  if (!row?.value) return {};
  try {
    const parsed = JSON.parse(row.value) as StatsBlob;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeBlob(blob: StatsBlob): Promise<void> {
  await db
    .insert(settings)
    .values({ key: STATS_KEY, value: JSON.stringify(blob) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(blob), updatedAt: new Date() } });
}

/** Drop buckets older than the retention window. */
function prune(blob: StatsBlob): StatsBlob {
  const keys = Object.keys(blob).sort(); // ascending date
  if (keys.length <= RETENTION_DAYS) return blob;
  const keep = keys.slice(-RETENTION_DAYS);
  const next: StatsBlob = {};
  for (const k of keep) next[k] = blob[k];
  return next;
}

/**
 * Increment a counter for today. `latencyMs` is recorded for answered/escalated
 * events. Best-effort: swallows all errors.
 */
export async function bumpAiStat(event: AiStatEvent, latencyMs?: number): Promise<void> {
  try {
    const blob = await readBlob();
    const key = todayKey();
    const day = blob[key] ?? emptyDay();
    day[event] += 1;
    if ((event === 'answered' || event === 'escalated') && typeof latencyMs === 'number' && latencyMs >= 0) {
      day.latencyMs += latencyMs;
      day.latencyN += 1;
    }
    blob[key] = day;
    await writeBlob(prune(blob));
  } catch (e) {
    console.error('[AI STATS] bump failed:', e instanceof Error ? e.message : e);
  }
}

export interface AiStatsSummary {
  days: number;
  answered: number;
  fallback: number;
  escalated: number;
  error: number;
  total: number;          // answered + fallback + escalated + error
  fallbackRate: number;   // fallback / total (0..1)
  escalationRate: number; // escalated / total (0..1)
  avgLatencyMs: number;   // average over recorded samples
  daily: Array<{ date: string } & DayStat>; // ascending, padded gaps omitted
}

/** Aggregate stats over the last `days` (default 7). */
export async function readAiStats(days = 7): Promise<AiStatsSummary> {
  const blob = await readBlob();
  const entries = Object.entries(blob).sort(([a], [b]) => a.localeCompare(b)); // ascending
  const recent = entries.slice(-days);

  const sum = emptyDay();
  for (const [, d] of recent) {
    sum.answered += d.answered;
    sum.fallback += d.fallback;
    sum.escalated += d.escalated;
    sum.error += d.error;
    sum.latencyMs += d.latencyMs;
    sum.latencyN += d.latencyN;
  }

  const total = sum.answered + sum.fallback + sum.escalated + sum.error;
  return {
    days,
    answered: sum.answered,
    fallback: sum.fallback,
    escalated: sum.escalated,
    error: sum.error,
    total,
    fallbackRate: total > 0 ? sum.fallback / total : 0,
    escalationRate: total > 0 ? sum.escalated / total : 0,
    avgLatencyMs: sum.latencyN > 0 ? Math.round(sum.latencyMs / sum.latencyN) : 0,
    daily: recent.map(([date, d]) => ({ date, ...d })),
  };
}
