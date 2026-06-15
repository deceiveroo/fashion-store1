// Admin API: AI usage analytics (read-only).
// GET ?days=7 -> aggregate counters + daily breakdown from lib/ai/stats.

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/server-auth';
import { readAiStats } from '@/lib/ai/stats';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const daysParam = Number(req.nextUrl.searchParams.get('days'));
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 30 ? Math.floor(daysParam) : 7;

  const stats = await readAiStats(days);
  return NextResponse.json(stats);
}
