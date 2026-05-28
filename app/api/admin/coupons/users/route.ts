import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles, coupons, userCouponUsage } from '@/lib/schema';
import { userPurchasedCoupons } from '@/lib/db/gamification-schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/coupons/users — для каждого пользователя возвращает все его персональные коды:
//   1) использованные при оформлении заказа (userCouponUsage)
//   2) активные купленные за монеты или выданные админом (userPurchasedCoupons, redeemed=false, не истёкшие)
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        avatar: userProfiles.avatar,
        image: users.image,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .orderBy(desc(users.createdAt));

    const allUsedCoupons = await db
      .select({
        id: userCouponUsage.id,
        userId: userCouponUsage.userId,
        couponId: userCouponUsage.couponId,
        orderId: userCouponUsage.orderId,
        discountAmount: userCouponUsage.discountAmount,
        usedAt: userCouponUsage.usedAt,
        couponCode: coupons.code,
        couponDiscount: coupons.discount,
        couponType: coupons.type,
        couponExpiresAt: coupons.expiresAt,
      })
      .from(userCouponUsage)
      .innerJoin(coupons, eq(userCouponUsage.couponId, coupons.id))
      .orderBy(desc(userCouponUsage.usedAt));

    // Активные коды: купленные за монеты или выданные админом, ещё не использованные.
    const allActivePurchased = await db
      .select({
        id: userPurchasedCoupons.id,
        userId: userPurchasedCoupons.userId,
        couponCode: userPurchasedCoupons.couponCode,
        coinsSpent: userPurchasedCoupons.coinsSpent,
        purchasedAt: userPurchasedCoupons.purchasedAt,
        expiresAt: userPurchasedCoupons.expiresAt,
        couponDiscount: coupons.discount,
        couponType: coupons.type,
        couponId: coupons.id,
      })
      .from(userPurchasedCoupons)
      .leftJoin(coupons, eq(userPurchasedCoupons.couponCode, coupons.code))
      .where(
        and(
          eq(userPurchasedCoupons.redeemed, false),
          gt(userPurchasedCoupons.expiresAt, now),
        ),
      )
      .orderBy(desc(userPurchasedCoupons.purchasedAt));

    const usedByUser = new Map<string, any[]>();
    for (const u of allUsedCoupons) {
      const list = usedByUser.get(u.userId) ?? [];
      list.push({
        id: u.id,
        couponId: u.couponId,
        code: u.couponCode,
        discount: u.couponDiscount,
        type: u.couponType,
        status: 'used' as const,
        source: 'order' as const,
        isValid: false,
        isExpired: false,
        discountAmount: u.discountAmount,
        expiresAt: u.couponExpiresAt,
        usedAt: u.usedAt,
        orderId: u.orderId,
        createdAt: u.usedAt,
      });
      usedByUser.set(u.userId, list);
    }

    const activeByUser = new Map<string, any[]>();
    for (const p of allActivePurchased) {
      const list = activeByUser.get(p.userId) ?? [];
      list.push({
        id: `purchased:${p.id}`,
        couponId: p.couponId,
        code: p.couponCode,
        discount: p.couponDiscount,
        type: p.couponType,
        status: 'active' as const,
        source: p.coinsSpent > 0 ? ('shop' as const) : ('gift' as const),
        coinsSpent: p.coinsSpent,
        isValid: true,
        isExpired: false,
        expiresAt: p.expiresAt,
        purchasedAt: p.purchasedAt,
        createdAt: p.purchasedAt,
      });
      activeByUser.set(p.userId, list);
    }

    const usersWithCoupons = allUsers.map((user) => {
      const used = usedByUser.get(user.id) ?? [];
      const active = activeByUser.get(user.id) ?? [];
      const list = [...active, ...used];
      const totalSavings = used.reduce((sum, c) => {
        const amount = c.discountAmount || '0';
        return sum + (typeof amount === 'string' ? parseFloat(amount) : amount);
      }, 0);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || user.image,
        role: user.role,
        createdAt: user.createdAt?.toISOString() || '',
        coupons: list,
        totalCoupons: list.length,
        activeCount: active.length,
        usedCount: used.length,
        expiredCount: 0,
        totalSavings,
      };
    });

    return NextResponse.json({ success: true, users: usersWithCoupons });
  } catch (error) {
    console.error('Error fetching users with coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users with coupons' },
      { status: 500 },
    );
  }
}
