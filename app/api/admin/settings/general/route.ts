import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { cacheDelete } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const KEYS = {
  storeName: 'store_name',
  currency: 'store_currency',
  tax: 'store_tax',
  contactEmail: 'store_contact_email',
  contactPhone: 'store_contact_phone',
  lowStock: 'inventory_low_stock_threshold',
  featGamification: 'feature_gamification',
  featReviews: 'feature_reviews',
  featChat: 'feature_chat',
} as const;

async function requireStaff() {
  const s = await auth();
  if (!s?.user || !['admin', 'manager'].includes(s.user.role as string)) return null;
  return s.user;
}

export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const rows = await db.select().from(settings).where(inArray(settings.key, Object.values(KEYS)));
  const m: Record<string, string | null> = {};
  rows.forEach((r) => { m[r.key] = r.value; });

  return NextResponse.json({
    storeName: m[KEYS.storeName] ?? 'ELEVATE',
    currency: m[KEYS.currency] ?? '₽',
    tax: m[KEYS.tax] ?? '20',
    contactEmail: m[KEYS.contactEmail] ?? 'ELEVATE111@yandex.com',
    contactPhone: m[KEYS.contactPhone] ?? '+7 (495) 123-45-67',
    lowStock: m[KEYS.lowStock] ?? '10',
    featGamification: m[KEYS.featGamification] !== 'false',
    featReviews: m[KEYS.featReviews] !== 'false',
    featChat: m[KEYS.featChat] !== 'false',
  });
}

export async function PUT(request: Request) {
  if (!(await requireStaff())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await request.json();
  const updates: Array<{ key: string; value: string }> = [];
  const put = (key: string, v: unknown) => { if (v !== undefined) updates.push({ key, value: String(v) }); };

  put(KEYS.storeName, body.storeName);
  put(KEYS.currency, body.currency);
  put(KEYS.tax, body.tax);
  put(KEYS.contactEmail, body.contactEmail);
  put(KEYS.contactPhone, body.contactPhone);
  put(KEYS.lowStock, body.lowStock);
  put(KEYS.featGamification, body.featGamification);
  put(KEYS.featReviews, body.featReviews);
  put(KEYS.featChat, body.featChat);

  for (const { key, value } of updates) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }

  // Сбрасываем публичный кэш фич-флагов в Redis, чтобы изменения применились сразу
  // во всех инстансах (ключ совпадает с FEATURE_FLAGS_CACHE_KEY в /api/feature-flags).
  await cacheDelete('feature-flags');

  return NextResponse.json({ success: true });
}
