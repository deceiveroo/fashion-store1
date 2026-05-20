import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shopCoupons, userPurchasedCoupons, userLevels } from '@/lib/db/gamification-schema';
import { coupons } from '@/lib/schema';
import { eq, and, isNull, gt, or, lte } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/gamification/shop - Get available coupons for purchase
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's coins
    const userLevelResult = await db
      .select()
      .from(userLevels)
      .where(eq(userLevels.userId, session.user.id))
      .limit(1);

    const userCoins = userLevelResult[0]?.coins || 0;

    // Get all active shop coupons
    const availableCoupons = await db
      .select()
      .from(shopCoupons)
      .where(eq(shopCoupons.isActive, true));

    // Check which coupons user already purchased (not redeemed yet)
    const purchasedCoupons = await db
      .select()
      .from(userPurchasedCoupons)
      .where(
        and(
          eq(userPurchasedCoupons.userId, session.user.id),
          eq(userPurchasedCoupons.redeemed, false),
          gt(userPurchasedCoupons.expiresAt, new Date())
        )
      );

    const purchasedCodes = new Set(purchasedCoupons.map(pc => pc.shopCouponId));

    // Format response
    const coupons = availableCoupons.map(coupon => ({
      id: coupon.id,
      name: coupon.name,
      couponCode: coupon.couponCode,
      discount: coupon.discount,
      discountType: coupon.discountType,
      minOrder: coupon.minOrder,
      maxUses: coupon.maxUses,
      expiresDays: coupon.expiresDays,
      priceCoins: coupon.priceCoins,
      description: coupon.description,
      stock: coupon.stock,
      purchasedCount: coupon.purchasedCount,
      canAfford: userCoins >= coupon.priceCoins,
      alreadyPurchased: purchasedCodes.has(coupon.id),
      inStock: !coupon.stock || (coupon.purchasedCount || 0) < coupon.stock,
    }));

    return NextResponse.json({
      userCoins,
      coupons,
    });
  } catch (error) {
    console.error('Error fetching shop coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop coupons' },
      { status: 500 }
    );
  }
}

// POST /api/gamification/shop - Purchase a coupon with coins
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shopCouponId } = body;

    if (!shopCouponId) {
      return NextResponse.json(
        { error: 'Shop coupon ID is required' },
        { status: 400 }
      );
    }

    // Get shop coupon details
    const shopCouponResult = await db
      .select()
      .from(shopCoupons)
      .where(eq(shopCoupons.id, shopCouponId))
      .limit(1);

    if (shopCouponResult.length === 0) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    const shopCoupon = shopCouponResult[0];

    if (!shopCoupon.isActive) {
      return NextResponse.json(
        { error: 'Coupon is not available for purchase' },
        { status: 400 }
      );
    }

    // Check stock
    if (shopCoupon.stock && (shopCoupon.purchasedCount || 0) >= shopCoupon.stock) {
      return NextResponse.json(
        { error: 'Coupon is out of stock' },
        { status: 400 }
      );
    }

    // Get user's coins
    const userLevelResult = await db
      .select()
      .from(userLevels)
      .where(eq(userLevels.userId, session.user.id))
      .limit(1);

    if (userLevelResult.length === 0) {
      return NextResponse.json(
        { error: 'User level not found' },
        { status: 404 }
      );
    }

    const userCoins = userLevelResult[0].coins;

    if (userCoins < shopCoupon.priceCoins) {
      return NextResponse.json(
        { error: 'Not enough coins' },
        { status: 400 }
      );
    }

    // Check if user already has this coupon (not redeemed)
    const existingPurchase = await db
      .select()
      .from(userPurchasedCoupons)
      .where(
        and(
          eq(userPurchasedCoupons.userId, session.user.id),
          eq(userPurchasedCoupons.shopCouponId, shopCouponId),
          eq(userPurchasedCoupons.redeemed, false),
          gt(userPurchasedCoupons.expiresAt, new Date())
        )
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json(
        { error: 'You already have this coupon' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (shopCoupon.expiresDays || 14));

    // Create the actual coupon in coupons table
    const couponExpiresAt = new Date();
    couponExpiresAt.setDate(couponExpiresAt.getDate() + (shopCoupon.expiresDays || 14));

    // Generate unique random coupon code (8-10 characters)
    const generateRandomCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const length = Math.floor(Math.random() * 3) + 8; // 8, 9, or 10 characters
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Ensure code is unique
    let uniqueCode = generateRandomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, uniqueCode))
        .limit(1);
      
      if (existing.length === 0) break;
      uniqueCode = generateRandomCode();
      attempts++;
    }

    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: uniqueCode,
        discount: shopCoupon.discount,
        type: shopCoupon.discountType as any,
        minOrder: shopCoupon.minOrder,
        maxUses: shopCoupon.maxUses,
        usedCount: 0,
        active: true,
        expiresAt: couponExpiresAt,
        createdBy: session.user.id,
      })
      .returning();

    // Record the purchase
    await db.insert(userPurchasedCoupons).values({
      userId: session.user.id,
      shopCouponId: shopCoupon.id,
      couponCode: newCoupon.code,
      coinsSpent: shopCoupon.priceCoins,
      redeemed: false,
      expiresAt: expiresAt,
    });

    // Deduct coins from user
    await db
      .update(userLevels)
      .set({
        coins: userCoins - shopCoupon.priceCoins,
        updatedAt: new Date(),
      })
      .where(eq(userLevels.userId, session.user.id));

    // Update purchased count
    await db
      .update(shopCoupons)
      .set({
        purchasedCount: (shopCoupon.purchasedCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(shopCoupons.id, shopCoupon.id));

    return NextResponse.json({
      success: true,
      coupon: {
        code: newCoupon.code,
        discount: shopCoupon.discount,
        discountType: shopCoupon.discountType,
        expiresAt: expiresAt,
      },
      remainingCoins: userCoins - shopCoupon.priceCoins,
    });
  } catch (error) {
    console.error('Error purchasing coupon:', error);
    return NextResponse.json(
      { error: 'Failed to purchase coupon' },
      { status: 500 }
    );
  }
}
