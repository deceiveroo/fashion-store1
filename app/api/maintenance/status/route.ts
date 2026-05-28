import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';

// In-memory кеш — статус обслуживания меняется редко, а MaintenanceCheck
// дёргает этот эндпоинт у КАЖДОГО клиента каждые 30 сек. Без кеша это
// SELECT на каждый запрос. 60 сек TTL = окно реакции на включение/выключение.
let cached: { data: any; until: number } | null = null;
const CACHE_TTL_MS = 60_000;

// Fallback ответ если БД упала — лучше отдать «всё хорошо», чем 500.
const FALLBACK = {
  maintenanceMode: false,
  title: 'Сайт на обслуживании',
  description: 'Мы проводим технические работы. Сайт скоро будет доступен.',
  endTime: null,
  backgroundImage: null,
  enableSubscription: true,
  memeImage: null,
};

// GET /api/maintenance/status - Get public maintenance status (no auth required)
export async function GET() {
  const now = Date.now();
  if (cached && cached.until > now) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    });
  }

  try {
    // Fetch all maintenance-related settings
    const keys = [
      'maintenance_mode',
      'maintenance_title',
      'maintenance_description',
      'maintenance_end_time',
      'maintenance_background_image',
      'maintenance_enable_subscription',
      'maintenance_meme_image',
    ];

    const result = await db.select().from(settings).where(
      inArray(settings.key, keys)
    );

    // Convert to key-value object
    const config: Record<string, string | null> = {};
    result.forEach((row) => {
      config[row.key] = row.value;
    });

    const payload = {
      maintenanceMode: config.maintenance_mode === 'true',
      title: config.maintenance_title || FALLBACK.title,
      description: config.maintenance_description || FALLBACK.description,
      endTime: config.maintenance_end_time || null,
      backgroundImage: config.maintenance_background_image || null,
      enableSubscription: config.maintenance_enable_subscription !== 'false',
      memeImage: config.maintenance_meme_image || null,
    };

    cached = { data: payload, until: now + CACHE_TTL_MS };
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    // Кешируем fallback на короткое время, чтобы не штурмовать упавшую БД.
    cached = { data: FALLBACK, until: now + 10_000 };
    return NextResponse.json(FALLBACK);
  }
}
