import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { userCouponUsage } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/profile/coupons/[id] - Delete user's coupon usage record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Try to find in userCouponUsage first (used coupons)
    let [usage] = await db
      .select()
      .from(userCouponUsage)
      .where(and(eq(userCouponUsage.id, id), eq(userCouponUsage.userId, userId)));

    // If not found, it might be an available coupon - we can't delete those
    // Available coupons are system-wide, users just haven't used them yet
    if (!usage) {
      return NextResponse.json({ 
        error: 'Нельзя удалить доступный промокод. Можно удалить только запись об использовании.' 
      }, { status: 400 });
    }

    // Delete the coupon usage record
    await db.delete(userCouponUsage).where(eq(userCouponUsage.id, id));

    return NextResponse.json({
      success: true,
      message: 'Запись о использовании промокода удалена',
    });
  } catch (error) {
    console.error('Error deleting coupon usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
