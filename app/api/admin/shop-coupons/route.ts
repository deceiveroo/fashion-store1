import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shopCoupons } from '@/lib/db/gamification-schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/shop-coupons - Get all shop coupons
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

    const coupons = await db
      .select()
      .from(shopCoupons)
      .orderBy(desc(shopCoupons.createdAt));

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching shop coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/admin/shop-coupons - Create new shop coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      discount,
      discountType,
      priceCoins,
      stock,
      maxUses,
      expiresDays,
      minOrder,
      isActive,
      couponCode,
    } = body;

    if (!name || !discount || !priceCoins || !couponCode) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const [newCoupon] = await db
      .insert(shopCoupons)
      .values({
        name,
        couponCode,
        description: description || '',
        discount,
        discountType: discountType || 'percent',
        priceCoins,
        stock,
        maxUses: maxUses || 1,
        expiresDays: expiresDays || 30,
        minOrder,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('Error creating shop coupon:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
