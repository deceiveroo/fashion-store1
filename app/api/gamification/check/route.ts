import { NextRequest, NextResponse } from 'next/server';
import { checkAchievements } from '@/lib/gamification';
import { getSession } from '@/lib/server-auth';

// POST /api/gamification/check - Check achievements for user action
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, value } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Check and unlock achievements
    const result = await checkAchievements(session.user.id, action, value);

    if (result.success) {
      return NextResponse.json({
        success: true,
        unlocked: result.unlocked || []
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to check achievements' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in gamification check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
