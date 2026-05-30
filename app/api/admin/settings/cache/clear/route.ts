import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/settings/cache/clear — сбросить серверный in-memory кэш
 * (товары/категории/аналитика/конфиг). Только admin.
 */
export async function POST() {
  const s = await auth();
  if (!s?.user || s.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const cleared = cache.getStats().size;
  cache.clear();
  return NextResponse.json({ success: true, cleared });
}
