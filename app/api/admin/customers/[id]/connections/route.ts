import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/customers/[id]/connections — привязанные соц-аккаунты пользователя
 * (Google/Telegram) для просмотра в админке. session_state — человекочитаемая подпись.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const rows = await db.select().from(accounts).where(eq(accounts.userId, id));
  const connections = rows
    .filter((r) => r.provider === 'google' || r.provider === 'telegram')
    .map((r) => ({ provider: r.provider, label: r.session_state || r.providerAccountId }));

  return NextResponse.json({ success: true, connections });
}

/**
 * DELETE /api/admin/customers/[id]/connections?provider=google|telegram — отвязать
 * провайдера у пользователя (админ). Пользователь больше не сможет войти этим способом.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const provider = new URL(req.url).searchParams.get('provider');
  if (provider !== 'google' && provider !== 'telegram') {
    return NextResponse.json({ error: 'Неверный провайдер' }, { status: 400 });
  }

  const deleted = await db
    .delete(accounts)
    .where(and(eq(accounts.userId, id), eq(accounts.provider, provider)))
    .returning({ id: accounts.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Связь не найдена' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
