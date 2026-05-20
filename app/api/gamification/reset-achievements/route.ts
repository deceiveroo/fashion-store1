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

    // Delete all user achievements
    await db.execute(sql`
      DELETE FROM user_achievements
      WHERE user_id = ${userId}
    `);

    // Reset achievement progress in user_levels if needed
    // (achievements are tracked separately, so this should be enough)

    return NextResponse.json({
      success: true,
      message: 'Все достижения сброшены. Вы можете начать зарабатывать их заново!',
    });
  } catch (error) {
    console.error('Error resetting achievements:', error);
    return NextResponse.json(
      { error: 'Failed to reset achievements' },
      { status: 500 }
    );
  }
}
