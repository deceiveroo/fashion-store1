import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, userCouponUsage } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/profile/my-coupons - Get user's coupons with correct statuses
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Get all coupons the user has used
    const usedCoupons = await db
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
        couponMinOrder: coupons.minOrder,
      })
      .from(userCouponUsage)
      .innerJoin(coupons, eq(userCouponUsage.couponId, coupons.id))
      .where(eq(userCouponUsage.userId, userId))
      .orderBy(desc(userCouponUsage.usedAt));

    // Calculate total savings
    const totalSavings = usedCoupons.reduce((sum, usage) => {
      return sum + parseFloat(usage.discountAmount || '0');
    }, 0);

    // Format response - only show used coupons
    const formattedUsed = usedCoupons.map(usage => ({
      id: usage.id,
      couponId: usage.couponId,
      code: usage.couponCode,
      discount: usage.couponDiscount,
      type: usage.couponType,
      status: 'used' as const,
      usedAt: usage.usedAt,
      discountAmount: usage.discountAmount,
      orderId: usage.orderId,
      isExpired: false, // Already used, expiration doesn't matter
      isValid: false,
    }));

    return NextResponse.json({
      success: true,
      coupons: formattedUsed,
      stats: {
        totalSavings: Math.round(totalSavings),
        usedCount: usedCoupons.length,
        activeCount: 0,
        expiredCount: 0,
      }
    });
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}
