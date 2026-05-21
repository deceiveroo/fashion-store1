import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userProfiles, coupons, userCouponUsage } from '@/lib/schema';
import { eq, desc, and, or, isNull, gte, lt } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/coupons/users - Get all users with their coupons
export async function GET(request: NextRequest) {
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

    // Get all users with profiles
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

    // Get all used coupons by all users
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

    // Get all active coupons (available to all users)
    const allActiveCoupons = await db
      .select()
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

    // Group used coupons by user
    const userUsedCouponsMap = new Map<string, any[]>();
    allUsedCoupons.forEach(usage => {
      const userId = usage.userId;
      if (!userUsedCouponsMap.has(userId)) {
        userUsedCouponsMap.set(userId, []);
      }
      userUsedCouponsMap.get(userId)?.push({
        id: usage.id,
        code: usage.couponCode,
        discount: usage.couponDiscount,
        type: usage.couponType,
        status: 'used',
        isValid: false,
        isExpired: false,
        discountAmount: usage.discountAmount,
        expiresAt: usage.couponExpiresAt,
        usedAt: usage.usedAt,
        orderId: usage.orderId,
        createdAt: usage.usedAt,
      });
    });

    // Build response - for each user, show their used coupons + available active coupons
    const usersWithCoupons = allUsers
      .map(user => {
        const usedCoupons = userUsedCouponsMap.get(user.id) || [];
        
        // For simplicity, show only used coupons per user
        // Active coupons are available to everyone, so we don't duplicate them
        const userCouponsList = usedCoupons;
        
        const activeCount = 0; // We're showing used coupons only
        const usedCount = userCouponsList.length;
        const expiredCount = 0;
        const totalSavings = userCouponsList.reduce((sum, c) => {
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
          coupons: userCouponsList,
          totalCoupons: userCouponsList.length,
          activeCount,
          usedCount,
          expiredCount,
          totalSavings,
        };
      })
      .filter(user => user.totalCoupons > 0); // Only show users who have used coupons

    return NextResponse.json({
      success: true,
      users: usersWithCoupons,
    });
  } catch (error) {
    console.error('Error fetching users with coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users with coupons' },
      { status: 500 }
    );
  }
}
