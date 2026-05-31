import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { userPurchasedCoupons } from '@/lib/db/gamification-schema';
import { coupons } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/profile/my-coupons/[id] - Delete purchased coupon
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

    // Check if this is a purchased coupon (format: "purchased:uuid")
    if (!id.startsWith('purchased:')) {
      return NextResponse.json({
        error: 'Можно удалить только купленные промокоды'
      }, { status: 400 });
    }

    // Extract the actual ID
    const actualId = id.replace('purchased:', '');

    // Find the purchased coupon
    const [purchasedCoupon] = await db
      .select()
      .from(userPurchasedCoupons)
      .where(
        and(
          eq(userPurchasedCoupons.id, actualId),
          eq(userPurchasedCoupons.userId, userId)
        )
      );

    if (!purchasedCoupon) {
      return NextResponse.json({
        error: 'Промокод не найден'
      }, { status: 404 });
    }

    // Check if the coupon has been redeemed
    if (purchasedCoupon.redeemed) {
      return NextResponse.json({
        error: 'Нельзя удалить использованный промокод'
      }, { status: 400 });
    }

    // Delete the purchased coupon record
    await db
      .delete(userPurchasedCoupons)
      .where(eq(userPurchasedCoupons.id, actualId));

    // Optionally deactivate the coupon in the coupons table if it exists
    // This prevents the code from being used even if someone has it
    await db
      .update(coupons)
      .set({ active: false })
      .where(eq(coupons.code, purchasedCoupon.couponCode));

    return NextResponse.json({
      success: true,
      message: 'Промокод успешно удален',
    });
  } catch (error) {
    console.error('Error deleting purchased coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
