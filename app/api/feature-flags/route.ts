import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// Ключ кэша фич-флагов в Redis. Тот же ключ инвалидируется в PUT
// /api/admin/settings/general при переключении модулей.
export const FEATURE_FLAGS_CACHE_KEY = 'feature-flags';
const FEATURE_FLAGS_TTL_SECONDS = 300; // 5 минут

/**
 * GET /api/feature-flags — публичные фич-флаги (вкл/выкл модулей).
 * Кэш в Redis (Upstash): общий для всех serverless-инстансов и переживает
 * cold start (раньше был in-memory Map — у каждого инстанса свой, hit-rate низкий).
 * Если Redis недоступен — cacheGet вернёт null, и мы просто читаем из БД.
 */
export async function GET() {
  const cached = await cacheGet<Record<string, boolean>>(FEATURE_FLAGS_CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, ['feature_gamification', 'feature_reviews', 'feature_chat']));
  const m: Record<string, string | null> = {};
  rows.forEach((r) => { m[r.key] = r.value; });

  const flags = {
    gamification: m['feature_gamification'] !== 'false',
    reviews: m['feature_reviews'] !== 'false',
    chat: m['feature_chat'] !== 'false',
  };
  await cacheSet(FEATURE_FLAGS_CACHE_KEY, flags, FEATURE_FLAGS_TTL_SECONDS);
  return NextResponse.json(flags);
}
