import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userWishlistItems, products, productImages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlistItems = await db
      .select({
        id: userWishlistItems.id,
        productId: userWishlistItems.productId,
        addedAt: userWishlistItems.createdAt,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          inStock: products.inStock,
        },
      })
      .from(userWishlistItems)
      .leftJoin(products, eq(userWishlistItems.productId, products.id))
      .where(eq(userWishlistItems.userId, user.id))
      .orderBy(desc(userWishlistItems.createdAt));

    // Get images for each product
    const itemsWithImages = await Promise.all(
      wishlistItems.map(async (item) => {
        if (!item.product) return { ...item, image: null };
        
        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, item.productId))
          .orderBy(productImages.order)
          .limit(1);

        return {
          ...item,
          image: images[0]?.url || null,
        };
      })
    );

    return NextResponse.json({ items: itemsWithImages });
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
      .from(userWishlistItems)
      .where(
        and(
          eq(userWishlistItems.userId, user.id),
          eq(userWishlistItems.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
    }

    const [item] = await db
      .insert(userWishlistItems)
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
      .delete(userWishlistItems)
      .where(
        and(
          eq(userWishlistItems.userId, user.id),
          eq(userWishlistItems.productId, productId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
