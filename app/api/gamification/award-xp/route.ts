import { NextRequest, NextResponse } from 'next/server';
import { awardXP } from '@/lib/gamification';
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
