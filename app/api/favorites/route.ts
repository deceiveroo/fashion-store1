import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { userWishlistItems, products, productImages } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';

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
      safeQuery(() => db.select().from(products).where(inArray(products.id, favoriteProductIds))),
      safeQuery(() => db.select().from(productImages).where(inArray(productImages.productId, favoriteProductIds)).orderBy(productImages.order)),
    ]);

    const result = (favoriteProducts || []).map(product => {
      const imgs = (allImages || []).filter(img => img.productId === product.id);
      const mainImage = imgs.find(img => img.isMain)?.url || imgs[0]?.url || '/placeholder-image.jpg';
      return { ...product, image: mainImage, category: 'Избранное' };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    if (error.message?.includes('does not exist')) return NextResponse.json([]);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

    const existing = await safeQuery(() =>
      db.select().from(userWishlistItems)
        .where(and(eq(userWishlistItems.userId, userId), eq(userWishlistItems.productId, productId)))
        .limit(1)
    );

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Already in favorites' }, { status: 400 });
    }

    const [result] = await db.insert(userWishlistItems).values({ userId, productId }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

    await safeQuery(() =>
      db.delete(userWishlistItems)
        .where(and(eq(userWishlistItems.userId, userId), eq(userWishlistItems.productId, productId)))
    );

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}