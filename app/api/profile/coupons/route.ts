import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userCouponUsage, coupons } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/profile/coupons - Get user's coupon usage history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's coupon usage with coupon details
    const usage = await db
      .select({
        id: userCouponUsage.id,
        couponId: userCouponUsage.couponId,
        orderId: userCouponUsage.orderId,
        discountAmount: userCouponUsage.discountAmount,
        usedAt: userCouponUsage.usedAt,
        couponCode: coupons.code,
        couponDiscount: coupons.discount,
        couponType: coupons.type,
        couponActive: coupons.active,
        couponExpiresAt: coupons.expiresAt,
      })
      .from(userCouponUsage)
      .innerJoin(coupons, eq(userCouponUsage.couponId, coupons.id))
      .where(eq(userCouponUsage.userId, userId))
      .orderBy(desc(userCouponUsage.usedAt));

    return NextResponse.json({
      success: true,
      coupons: usage.map(item => ({
        ...item,
        isExpired: item.couponExpiresAt && new Date(item.couponExpiresAt) < new Date(),
        isValid: item.couponActive && (!item.couponExpiresAt || new Date(item.couponExpiresAt) >= new Date()),
      }))
    });
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}
