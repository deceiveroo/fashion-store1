import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

/**
 * Выдать или отозвать верификацию у пользователя (только для админов)
 * POST /api/admin/users/[id]/verification/toggle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await isAdmin();
    if (!admin?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json().catch(() => ({}));
    const action: unknown = (body as { action?: unknown }).action;

    // Находим целевого пользователя
    const [targetUser] = await db
      .select({
        id: users.id,
        email: users.email,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Обновляем статус верификации
    const newStatus =
      action === 'grant'
        ? true
        : action === 'revoke'
          ? false
          : !(targetUser.isVerified ?? false);

    if (action !== undefined && action !== 'grant' && action !== 'revoke') {
      return NextResponse.json(
        { error: 'Invalid action. Use "grant" or "revoke"' },
        { status: 400 }
      );
    }

    await db.update(users).set({
      isVerified: newStatus,
      verifiedAt: newStatus ? new Date() : null,
    }).where(eq(users.id, targetUserId));

    return NextResponse.json({
      success: true,
      message: newStatus
        ? `Верификация выдана пользователю ${targetUser.email}`
        : `Верификация отозвана у пользователя ${targetUser.email}`,
      isVerified: newStatus,
    });
  } catch (error) {
    console.error('[ADMIN TOGGLE VERIFICATION] Error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle verification' },
      { status: 500 }
    );
  }
}
