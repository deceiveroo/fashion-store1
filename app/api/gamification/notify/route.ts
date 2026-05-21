import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// POST /api/gamification/notify - Trigger notification for level up or coupon reward
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, level, coinsAwarded, couponCode, discount, discountType } = body;

    // Create a system notification in the database
    let title = '';
    let message = '';
    let notificationType: 'info' | 'success' | 'warning' | 'error' = 'success';

    if (type === 'level_up') {
      title = `🎉 Достигнут уровень ${level}!`;
      message = `Поздравляем! Вы получили ${coinsAwarded} монет и перешли на новый уровень.`;
      notificationType = 'success';
    } else if (type === 'coupon_reward') {
      title = '🎁 Новый промокод получен!';
      message = `Вам вручен промокод ${couponCode} со скидкой ${discount}${discountType === 'percent' ? '%' : '₽'}!`;
      notificationType = 'success';
    }

    // Insert into system_notifications table with PERSONAL targeting
    await db.execute(sql`
      INSERT INTO system_notifications (title, message, type, target_audience, target_user_ids, is_active, created_by)
      VALUES (
        ${title},
        ${message},
        ${notificationType},
        'specific',
        ${[session.user.id]},
        true,
        ${session.user.id}
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
