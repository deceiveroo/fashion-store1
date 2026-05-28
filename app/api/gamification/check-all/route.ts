import { NextRequest, NextResponse } from 'next/server';
import { checkAchievements } from '@/lib/gamification';
import { getSession } from '@/lib/server-auth';

// Кеш per-user, чтобы не дёргать БД на каждый рефреш профиля.
// 60 секунд — компромисс: новые ачивки появляются с небольшой задержкой,
// зато profile-page не делает 3×N запросов при каждой загрузке.
const checkCache = new Map<string, { until: number; data: any }>();
const CHECK_CACHE_TTL_MS = 60_000;

// POST /api/gamification/check-all - Check all achievement categories for user (parallel + cached)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = Date.now();

    // Возврат из кеша если свежий.
    const cached = checkCache.get(userId);
    if (cached && cached.until > now) {
      return NextResponse.json(cached.data);
    }

    const checks = ['profile_complete', 'login', 'achievement_unlocked'];

    // ПАРАЛЛЕЛЬНО — раньше for-loop ждал каждый. На 3 проверки экономим ~2/3 времени.
    const results = await Promise.allSettled(
      checks.map((action) => checkAchievements(userId, action)),
    );

    const allUnlocked: any[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.success && r.value.unlocked) {
        allUnlocked.push(...r.value.unlocked);
      } else if (r.status === 'rejected') {
        console.error('check-all action failed:', r.reason);
      }
    }

    const payload = {
      success: true,
      unlocked: allUnlocked,
      count: allUnlocked.length,
    };

    checkCache.set(userId, { data: payload, until: now + CHECK_CACHE_TTL_MS });

    // Капсуляция роста: чистим раз в N записей.
    if (checkCache.size > 500) {
      for (const [k, v] of checkCache) {
        if (v.until <= now) checkCache.delete(k);
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error in check-all:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
