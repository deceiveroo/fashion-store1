import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { cache, CACHE_TTL } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feature-flags — публичные фич-флаги (вкл/выкл модулей), кэш на 5 минут.
 * Компоненты читают это, чтобы скрывать выключенные функции. По умолчанию всё включено.
 */
export async function GET() {
  const cached = cache.get<Record<string, boolean>>('feature-flags');
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
  cache.set('feature-flags', flags, CACHE_TTL.LONG);
  return NextResponse.json(flags);
}
