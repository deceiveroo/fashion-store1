import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// POST /api/gamification/reset-achievements - Reset all achievements (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Сколько XP/монет начислили текущие достижения — нужно вычесть обратно,
    // иначе после сброса и повторного открытия баланс инфлирует (монеты = реальные купоны).
    const grantedResult = await db.execute(sql`
      SELECT
        COALESCE(SUM(a.xp_reward), 0) AS xp,
        COALESCE(SUM(a.coins_reward), 0) AS coins
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ${userId}
    `);
    const granted = (grantedResult.rows?.[0] as any) || { xp: 0, coins: 0 };
    const grantedXp = parseInt(granted.xp || 0);
    const grantedCoins = parseInt(granted.coins || 0);

    // Возвращаем XP/монеты к до-ачивочному состоянию (с защитой от ухода в минус).
    await db.execute(sql`
      UPDATE user_levels
      SET xp = GREATEST(0, xp - ${grantedXp}),
          coins = GREATEST(0, coins - ${grantedCoins}),
          updated_at = NOW()
      WHERE user_id = ${userId}
    `);

    // Чистим связанные записи истории XP, чтобы debug/totalXPEarned не врал.
    await db.execute(sql`
      DELETE FROM xp_history
      WHERE user_id = ${userId}
        AND metadata ? 'achievement'
    `);

    // Delete all user achievements
    await db.execute(sql`
      DELETE FROM user_achievements
      WHERE user_id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Все достижения сброшены. Вы можете начать зарабатывать их заново!',
      refunded: { xp: grantedXp, coins: grantedCoins },
    });
  } catch (error) {
    console.error('Error resetting achievements:', error);
    return NextResponse.json(
      { error: 'Failed to reset achievements' },
      { status: 500 }
    );
  }
}
