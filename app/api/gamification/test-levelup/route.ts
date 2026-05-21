import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { awardXP, checkAchievements } from '@/lib/gamification';

// POST /api/gamification/test-levelup - Force level up/reset for testing (admin only)
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

    const body = await request.json();
    const { action = 'levelup', levelsToAdd = 1 } = body;

    const userId = session.user.id;

    if (action === 'reset') {
      // Reset to level 1
      await db.execute(sql`
        UPDATE user_levels
        SET level = 1,
            xp = 0,
            xp_to_next_level = 100,
            coins = 0,
            title = 'Новичок',
            updated_at = NOW()
        WHERE user_id = ${userId}
      `);

      return NextResponse.json({
        success: true,
        message: 'Level reset to 1',
        newLevel: 1,
      });
    }

    // Get current level
    const currentLevelResult = await db.execute(sql`
      SELECT level, xp, xp_to_next_level, coins
      FROM user_levels
      WHERE user_id = ${userId}
    `);

    if (currentLevelResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User level not found' },
        { status: 404 }
      );
    }

    const currentLevel = currentLevelResult.rows[0] as any;
    const newLevel = currentLevel.level + levelsToAdd;

    // Calculate XP needed for new level
    const xpNeeded = Math.floor(100 * Math.pow(newLevel, 1.5));
    const xpToAward = xpNeeded - currentLevel.xp + (currentLevel.xp_to_next_level * (levelsToAdd - 1));

    console.log(`[TEST] Awarding ${xpToAward} XP to reach level ${newLevel}`);

    // Award XP which will trigger level up and notifications
    const xpResult = await awardXP(userId, xpToAward, 'Test level up', { test: true });

    // Check achievements
    await checkAchievements(userId, 'level_up', newLevel);

    return NextResponse.json({
      success: true,
      message: `Leveled up from ${currentLevel.level} to ${newLevel}`,
      xpAwarded: xpToAward,
      newLevel,
      levelUpData: xpResult.levelUp, // Return level up data for client notifications
      notification: 'Check the modal popup and bell icon!',
    });
  } catch (error) {
    console.error('Error in test level up:', error);
    return NextResponse.json(
      { error: 'Failed to test level up' },
      { status: 500 }
    );
  }
}
