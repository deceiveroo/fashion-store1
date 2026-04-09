import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wishlist, products, productImages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await db
      .select({
        id: wishlist.id,
        productId: wishlist.productId,
        addedAt: wishlist.addedAt,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          inStock: products.inStock,
        },
        image: productImages.url,
      })
      .from(wishlist)
      .leftJoin(products, eq(wishlist.productId, products.id))
      .leftJoin(
        productImages,
        and(
          eq(productImages.productId, products.id),
          eq(productImages.isMain, true)
        )
      )
      .where(eq(wishlist.userId, user.id));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Check if already in wishlist
    const existing = await db
      .select()
      .from(wishlist)
      .where(
        and(
          eq(wishlist.userId, user.id),
          eq(wishlist.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
    }

    const [item] = await db
      .insert(wishlist)
      .values({
        userId: user.id,
        productId,
      })
      .returning();

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await db
      .delete(wishlist)
      .where(
        and(
          eq(wishlist.userId, user.id),
          eq(wishlist.productId, productId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
