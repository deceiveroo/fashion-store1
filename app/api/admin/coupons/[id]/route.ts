import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// GET /api/admin/coupons/[id] - Get single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const coupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (coupon.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ coupon: coupon[0] });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coupons/[id] - Update coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if coupon exists
    const existing = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // If code is being changed, check uniqueness
    if (code && code !== existing[0].code) {
      const codeExists = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, code.toUpperCase()))
        .limit(1);

      if (codeExists.length > 0) {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 409 }
        );
      }
    }

    // Validate discount
    if (discount) {
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
    }

    const updated = await db
      .update(coupons)
      .set({
        code: code ? code.toUpperCase() : undefined,
        discount: discount !== undefined ? discount : undefined,
        type: type || undefined,
        minOrder: minOrder !== undefined ? (minOrder ? String(minOrder) : null) : undefined,
        maxUses: maxUses !== undefined ? (maxUses || null) : undefined,
        active: active !== undefined ? active : undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      coupon: updated[0],
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await db
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
