import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, userCouponUsage } from '@/lib/schema';
import { eq, or, lte, gte, isNull, count, sql } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/coupons - Get all coupons (including expired and inactive)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or manager
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with optional active filter
    let allCoupons;
    if (active !== null) {
      allCoupons = await db
        .select()
        .from(coupons)
        .where(eq(coupons.active, active === 'true'));
    } else {
      allCoupons = await db.select().from(coupons);
    }
    
    // Get usage statistics for each coupon
    const couponsWithStats = await Promise.all(
      allCoupons.map(async (coupon) => {
        // Count how many unique users used this coupon
        const usageCount = await db
          .select({ count: count() })
          .from(userCouponUsage)
          .where(eq(userCouponUsage.couponId, coupon.id));

        return {
          ...coupon,
          userCount: usageCount[0]?.count || 0,
        };
      })
    );
    
    // Apply pagination
    const paginatedCoupons = couponsWithStats.slice(offset, offset + limit);

    return NextResponse.json({
      coupons: paginatedCoupons,
      total: couponsWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or manager
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { code, discount, type, minOrder, maxUses, expiresAt, active } = body;

    // Validate required fields
    if (!code || !discount || !type) {
      return NextResponse.json(
        { error: 'Code, discount, and type are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    // Validate discount based on type
    if (type === 'percent' && (discount < 1 || discount > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (type === 'fixed' && discount <= 0) {
      return NextResponse.json(
        { error: 'Fixed discount must be greater than 0' },
        { status: 400 }
      );
    }

    const newCoupon = await db
      .insert(coupons)
      .values({
        code: code.toUpperCase(),
        discount,
        type,
        minOrder: minOrder ? String(minOrder) : null,
        maxUses: maxUses || null,
        usedCount: 0,
        active: active !== undefined ? active : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      coupon: newCoupon[0],
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
