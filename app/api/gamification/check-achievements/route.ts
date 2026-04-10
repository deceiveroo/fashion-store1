import { NextRequest, NextResponse } from 'next/server';
import { checkAchievements } from '@/lib/gamification';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // For demo, use fixed UUID
    const userId = sessionCookie?.value || '00000000-0000-0000-0000-000000000000';

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
