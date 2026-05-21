import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

/**
 * Выдать или отозвать верификацию у пользователя (только для админов)
 * POST /api/admin/users/[userId]/verification/toggle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем что пользователь - админ
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        role: true,
      },
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.userId;
    const body = await request.json();
    const { action } = body;

    if (!action || !['grant', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "grant" or "revoke"' },
        { status: 400 }
      );
    }

    // Находим целевого пользователя
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Обновляем статус верификации
    const newStatus = action === 'grant';
    await db.update(users).set({
      isVerified: newStatus,
      verifiedAt: newStatus ? new Date() : null,
    }).where(eq(users.id, targetUserId));

    return NextResponse.json({
      success: true,
      message: action === 'grant' 
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
