import { NextRequest, NextResponse } from 'next/server';
import { checkAchievements } from '@/lib/gamification';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();
    const { action, value } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const result = await checkAchievements(userId, action, value);

    if (result.success) {
      return NextResponse.json({
        success: true,
        unlocked: result.unlocked
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to check achievements' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in check-achievements endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
