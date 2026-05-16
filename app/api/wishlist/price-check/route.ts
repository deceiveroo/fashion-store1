import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userWishlistItems, products, productImages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { safeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// GET /api/wishlist/price-check - Check for price drops in wishlist
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

    // Get all wishlist items with current prices and main image
    const wishlistItems = await safeQuery(() =>
      db
        .select({
          productId: userWishlistItems.productId,
          productName: products.name,
          currentPrice: products.price,
          compareAtPrice: products.compareAtPrice,
          productImage: productImages.url,
        })
        .from(userWishlistItems)
        .leftJoin(products, eq(userWishlistItems.productId, products.id))
        .leftJoin(
          productImages,
          and(
            eq(productImages.productId, userWishlistItems.productId),
            eq(productImages.isMain, true)
          )
        )
        .where(eq(userWishlistItems.userId, userId))
    );

    // Find items with price drops (compare with stored price in wishlist)
    // Since we don't store price in wishlist, we'll just return all items
    // The frontend can compare with cached prices
    return NextResponse.json({
      items: wishlistItems || [],
      totalItems: wishlistItems?.length || 0,
    });
  } catch (error) {
    console.error('Error checking wishlist prices:', error);
    return NextResponse.json(
      { error: 'Failed to check prices' },
      { status: 500 }
    );
  }
}
