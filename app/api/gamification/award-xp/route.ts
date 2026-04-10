import { NextRequest, NextResponse } from 'next/server';
import { awardXP } from '@/lib/gamification';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    // For demo, use fixed UUID
    const userId = sessionCookie?.value || '00000000-0000-0000-0000-000000000000';

    const body = await request.json();
    const { amount, reason, metadata } = body;

    if (!amount || !reason) {
      return NextResponse.json(
        { error: 'Amount and reason are required' },
        { status: 400 }
      );
    }

    const result = await awardXP(userId, amount, reason, metadata);

    if (result.success) {
      return NextResponse.json({ success: true, amount: result.amount });
    } else {
      return NextResponse.json(
        { error: 'Failed to award XP' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in award-xp endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
