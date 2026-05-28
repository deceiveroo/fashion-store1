import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, userCouponUsage } from '@/lib/schema';
import { userPurchasedCoupons } from '@/lib/db/gamification-schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/profile/my-coupons — used coupons (from orders) + purchased-with-coins coupons.
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // 1) Use history (used at checkout).
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
        couponMinOrder: coupons.minOrder,
      })
      .from(userCouponUsage)
      .innerJoin(coupons, eq(userCouponUsage.couponId, coupons.id))
      .where(eq(userCouponUsage.userId, userId))
      .orderBy(desc(userCouponUsage.usedAt));

    // 2) Active coupons bought with coins — kept around as long as they are still valid (not redeemed and not expired).
    const purchased = await db
      .select({
        id: userPurchasedCoupons.id,
        couponCode: userPurchasedCoupons.couponCode,
        coinsSpent: userPurchasedCoupons.coinsSpent,
        purchasedAt: userPurchasedCoupons.purchasedAt,
        expiresAt: userPurchasedCoupons.expiresAt,
        redeemed: userPurchasedCoupons.redeemed,
        couponDiscount: coupons.discount,
        couponType: coupons.type,
        couponMinOrder: coupons.minOrder,
      })
      .from(userPurchasedCoupons)
      .leftJoin(coupons, eq(userPurchasedCoupons.couponCode, coupons.code))
      .where(
        and(
          eq(userPurchasedCoupons.userId, userId),
          eq(userPurchasedCoupons.redeemed, false),
          gt(userPurchasedCoupons.expiresAt, now),
        ),
      )
      .orderBy(desc(userPurchasedCoupons.purchasedAt));

    const totalSavings = usedCoupons.reduce(
      (sum, u) => sum + parseFloat(u.discountAmount || '0'),
      0,
    );

    const formattedUsed = usedCoupons.map((u) => ({
      id: u.id,
      couponId: u.couponId,
      code: u.couponCode,
      discount: u.couponDiscount,
      type: u.couponType,
      minOrder: u.couponMinOrder,
      status: 'used' as const,
      source: 'order' as const,
      usedAt: u.usedAt,
      discountAmount: u.discountAmount,
      orderId: u.orderId,
      isExpired: false,
      isValid: false,
    }));

    const formattedPurchased = purchased.map((p) => ({
      id: `purchased:${p.id}`,
      couponId: undefined as string | undefined,
      code: p.couponCode,
      discount: p.couponDiscount,
      type: p.couponType,
      minOrder: p.couponMinOrder,
      status: 'active' as const,
      source: 'shop' as const,
      coinsSpent: p.coinsSpent,
      purchasedAt: p.purchasedAt,
      expiresAt: p.expiresAt,
      isExpired: false,
      isValid: true,
    }));

    const allCoupons = [...formattedPurchased, ...formattedUsed];

    return NextResponse.json({
      success: true,
      coupons: allCoupons,
      stats: {
        totalSavings: Math.round(totalSavings),
        usedCount: usedCoupons.length,
        activeCount: formattedPurchased.length,
        expiredCount: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}
