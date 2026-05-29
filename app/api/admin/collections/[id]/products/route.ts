import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collectionItems } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { safeQuery } from '@/lib/db';
import { isStaff } from '@/lib/server-auth';

// GET /api/admin/collections/[id]/products - Get products in collection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isStaff()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;

    const items = await safeQuery(() =>
      db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, id))
    );

    const productIds = items?.map(item => item.productId) || [];

    return NextResponse.json({
      productIds,
    });
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection products' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/collections/[id]/products - Update products in collection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isStaff()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { productIds } = body;

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array' },
        { status: 400 }
      );
    }

    // Delete existing items
    await safeQuery(() =>
      db.delete(collectionItems).where(eq(collectionItems.collectionId, id))
    );

    // Insert new items
    if (productIds.length > 0) {
      const values = productIds.map((productId, index) => ({
        collectionId: id,
        productId,
        sortOrder: index,
      }));

      await safeQuery(() =>
        db.insert(collectionItems).values(values)
      );
    }

    return NextResponse.json({
      success: true,
      count: productIds.length,
    });
  } catch (error) {
    console.error('Error updating collection products:', error);
    return NextResponse.json(
      { error: 'Failed to update collection products' },
      { status: 500 }
    );
  }
}
