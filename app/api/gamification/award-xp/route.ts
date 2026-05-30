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

    // XP начисляется только серверной логикой (заказы, отзывы, профиль и т.п.)
    // через lib/gamification → awardXP(). Открытый HTTP-эндпоинт с произвольным
    // amount = дыра в экономике (XP → монеты → реальные купоны), поэтому
    // ручное начисление доступно только администратору.
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, reason, metadata, targetUserId } = body;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !reason) {
      return NextResponse.json(
        { error: 'A positive numeric amount and a reason are required' },
        { status: 400 }
      );
    }

    // Админ может начислять себе или указанному пользователю
    const result = await awardXP(targetUserId || userId, amount, reason, metadata);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        amount: result.amount,
        levelUp: result.levelUp // Include level up info if it happened
      });
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
