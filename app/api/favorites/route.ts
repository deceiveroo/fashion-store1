import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { userWishlistItems, products, productImages } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { checkAchievements, awardXP } from '@/lib/gamification';

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  // Try Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
      const { payload } = await jwtVerify(authHeader.substring(7), secret);
      return payload.userId as string || payload.sub as string;
    } catch {}
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const favorites = await safeQuery(() =>
      db.select().from(userWishlistItems).where(eq(userWishlistItems.userId, userId))
    ) || [];

    const favoriteProductIds = favorites.map(f => f.productId);
    if (favoriteProductIds.length === 0) return NextResponse.json([]);

    const [favoriteProducts, allImages] = await Promise.all([
      safeQuery(() => 
        db.select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          stock: products.stock,
          featured: products.featured,
          isActive: products.isActive,
          inStock: products.inStock,
          slug: products.slug,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        }).from(products).where(inArray(products.id, favoriteProductIds))
      ),
      safeQuery(() => db.select().from(productImages).where(inArray(productImages.productId, favoriteProductIds)).orderBy(productImages.order)),
    ]);

    const result = (favoriteProducts || []).map(product => {
      const imgs = (allImages || []).filter(img => img.productId === product.id);
      const mainImage = imgs.find(img => img.isMain)?.url || imgs[0]?.url || '/placeholder-image.jpg';
      return { ...product, image: mainImage, category: 'Избранное' };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error fetching favorites:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist')) return NextResponse.json([]);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      console.error('[Favorites API] POST: Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Favorites API] POST: Invalid JSON body', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { productId } = body;
    if (!productId) {
      console.error('[Favorites API] POST: Missing productId in request body', { body });
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Validate productId format
    if (typeof productId !== 'string' || productId.trim() === '') {
      console.error('[Favorites API] POST: Invalid productId format', { productId });
      return NextResponse.json({ error: 'Invalid Product ID format' }, { status: 400 });
    }

    const existing = await safeQuery(() =>
      db.select().from(userWishlistItems)
        .where(and(eq(userWishlistItems.userId, userId), eq(userWishlistItems.productId, productId)))
        .limit(1)
    );

    if (existing && existing.length > 0) {
      console.log('[Favorites API] POST: Product already in favorites', { userId, productId });
      return NextResponse.json({ message: 'Product already in favorites' }, { status: 400 });
    }

    const [result] = await db.insert(userWishlistItems).values({ userId, productId }).returning();
    console.log('[Favorites API] POST: Successfully added to favorites', { userId, productId });

    // Gamification: Award XP for adding to favorites and check achievements
    try {
      await awardXP(userId, 5, 'Added to wishlist', { productId });
      await checkAchievements(userId, 'favorite');
    } catch (gamificationError) {
      console.error('[Favorites API] POST: Gamification error', gamificationError);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('[Favorites API] POST: Unexpected error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: 'Failed to add favorite',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      console.error('[Favorites API] DELETE: Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Favorites API] DELETE: Invalid JSON body', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { productId } = body;
    if (!productId) {
      console.error('[Favorites API] DELETE: Missing productId in request body', { body });
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await safeQuery(() =>
      db.delete(userWishlistItems)
        .where(and(eq(userWishlistItems.userId, userId), eq(userWishlistItems.productId, productId)))
    );

    console.log('[Favorites API] DELETE: Successfully removed from favorites', { userId, productId });
    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error: unknown) {
    console.error('[Favorites API] DELETE: Unexpected error', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: 'Failed to remove favorite',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}