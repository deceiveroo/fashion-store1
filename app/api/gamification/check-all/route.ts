import { NextRequest, NextResponse } from 'next/server';
import { checkAchievements } from '@/lib/gamification';
import { getSession } from '@/lib/server-auth';

// POST /api/gamification/check-all - Check all achievements for user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check all achievement categories
    const checks = [
      'profile_complete',
      'login',
      'achievement_unlocked',
    ];

    const allUnlocked: any[] = [];

    // Run all checks
    for (const action of checks) {
      try {
        const result = await checkAchievements(userId, action);
        if (result.success && result.unlocked) {
          allUnlocked.push(...result.unlocked);
        }
      } catch (error) {
        console.error(`Error checking ${action}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      unlocked: allUnlocked,
      count: allUnlocked.length
    });
  } catch (error) {
    console.error('Error in check-all:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
