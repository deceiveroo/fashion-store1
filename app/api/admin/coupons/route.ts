import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/schema';
import { eq, and, or, lte, gte, isNull } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// GET /api/admin/coupons - Get all coupons
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as string;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(coupons);

    if (active !== null) {
      query = query.where(eq(coupons.active, active === 'true'));
    }

    // Filter out expired coupons
    query = query.where(
      or(
        isNull(coupons.expiresAt),
        gte(coupons.expiresAt, new Date())
      )
    );

    const allCoupons = await query;
    
    // Apply pagination manually since we added custom filtering
    const paginatedCoupons = allCoupons.slice(offset, offset + limit);

    return NextResponse.json({
      coupons: paginatedCoupons,
      total: allCoupons.length,
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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as string;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
