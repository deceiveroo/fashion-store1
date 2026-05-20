import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { unlockAchievement } from '@/lib/gamification';

// POST /api/gamification/unlock - Force unlock achievement (admin only)
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
    const { achievementCode } = body;

    if (!achievementCode) {
      return NextResponse.json(
        { error: 'Achievement code is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Force unlock the achievement
    const result = await unlockAchievement(userId, achievementCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to unlock achievement' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Achievement unlocked',
      achievement: result.achievement,
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return NextResponse.json(
      { error: 'Failed to unlock achievement' },
      { status: 500 }
    );
  }
}
