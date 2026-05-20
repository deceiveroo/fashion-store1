import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, userCouponUsage } from '@/lib/schema';
import { eq, desc, or, isNull, gte, lt, and } from 'drizzle-orm';
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

    // Get all active coupons that user hasn't used yet
    const availableCoupons = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        discount: coupons.discount,
        type: coupons.type,
        minOrder: coupons.minOrder,
        maxUses: coupons.maxUses,
        usedCount: coupons.usedCount,
        active: coupons.active,
        expiresAt: coupons.expiresAt,
        createdAt: coupons.createdAt,
      })
      .from(coupons)
      .where(
        and(
          eq(coupons.active, true),
          or(
            isNull(coupons.expiresAt),
            gte(coupons.expiresAt, now)
          )
        )
      );

    // Filter out coupons that user already used
    const usedCouponIds = new Set(usedCoupons.map(u => u.couponId));
    const unusedCoupons = availableCoupons.filter(c => !usedCouponIds.has(c.id));

    // Calculate total savings
    const totalSavings = usedCoupons.reduce((sum, usage) => {
      return sum + parseFloat(usage.discountAmount || '0');
    }, 0);

    // Format response with proper statuses
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

    const formattedAvailable = unusedCoupons.map(coupon => {
      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
      const isActive = coupon.active && !isExpired;
      
      return {
        id: coupon.id,
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        minOrder: coupon.minOrder,
        status: isActive ? 'active' as const : 'expired' as const,
        expiresAt: coupon.expiresAt,
        isExpired,
        isValid: isActive,
        remainingUses: coupon.maxUses ? coupon.maxUses - (coupon.usedCount || 0) : null,
      };
    });

    return NextResponse.json({
      success: true,
      coupons: [...formattedAvailable, ...formattedUsed],
      stats: {
        totalSavings: Math.round(totalSavings),
        usedCount: usedCoupons.length,
        activeCount: formattedAvailable.filter(c => c.status === 'active').length,
        expiredCount: formattedAvailable.filter(c => c.status === 'expired').length,
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
