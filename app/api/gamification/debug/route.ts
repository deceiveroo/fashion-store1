import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/gamification/debug - Debug user level and XP status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check user_levels table
    const levelResult = await db.execute(sql`
      SELECT 
        id,
        user_id,
        level,
        xp,
        xp_to_next_level,
        title,
        coins,
        created_at,
        updated_at
      FROM user_levels
      WHERE user_id = ${userId}
    `);

    // Check XP history
    const xpHistoryResult = await db.execute(sql`
      SELECT 
        amount,
        reason,
        metadata,
        created_at
      FROM xp_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // Check achievements
    const achievementsResult = await db.execute(sql`
      SELECT 
        ua.unlocked_at,
        a.code,
        a.name,
        a.xp_reward,
        a.coins_reward
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ${userId}
      ORDER BY ua.unlocked_at DESC
    `);

    return NextResponse.json({
      success: true,
      userLevel: levelResult.rows?.[0] || null,
      xpHistory: xpHistoryResult.rows || [],
      achievements: achievementsResult.rows || [],
      totalXPEarned: (xpHistoryResult.rows || []).reduce((sum: number, row: any) => sum + (row.amount || 0), 0)
    });
  } catch (error) {
    console.error('Error in debug:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
