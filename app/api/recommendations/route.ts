import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, orderItems, productViews, curatedCollections, collectionItems } from '@/lib/schema';
import { eq, and, desc, lt, gt, sql, inArray } from 'drizzle-orm';
import { safeQuery } from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// GET /api/recommendations?type=similar&productId=xxx&limit=6
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'similar'; // similar, frequently_bought, new_in_category, trending, curated
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '6');
    const userId = searchParams.get('userId');

    let recommendations: any[] = [];

    switch (type) {
      case 'similar':
        if (!productId) {
          return NextResponse.json({ error: 'productId required for similar type' }, { status: 400 });
        }
        // Use cache for similar products
        const cacheKey = CACHE_KEYS.SIMILAR_PRODUCTS(productId);
        recommendations = await cache.getOrSet(
          cacheKey,
          () => getSimilarProducts(productId, limit),
          CACHE_TTL.MEDIUM
        );
        break;

      case 'frequently_bought':
        if (!productId) {
          return NextResponse.json({ error: 'productId required for frequently_bought type' }, { status: 400 });
        }
        recommendations = await getFrequentlyBoughtTogether(productId, limit);
        break;

      case 'new_in_category':
        if (!categoryId) {
          return NextResponse.json({ error: 'categoryId required for new_in_category type' }, { status: 400 });
        }
        recommendations = await getNewInCategory(categoryId, limit);
        break;

      case 'trending':
        // Cache trending products for 2 minutes (changes frequently)
        recommendations = await cache.getOrSet(
          CACHE_KEYS.TRENDING_PRODUCTS,
          () => getTrendingProducts(limit),
          CACHE_TTL.SHORT
        );
        break;

      case 'curated':
        const collectionSlug = searchParams.get('collectionSlug') || 'editors-choice';
        recommendations = await getCuratedCollection(collectionSlug, limit);
        break;

      default:
        return NextResponse.json({ error: 'Invalid recommendation type' }, { status: 400 });
    }

    return NextResponse.json({
      type,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// 1. Similar Products - same category, similar price (±20%)
async function getSimilarProducts(productId: string, limit: number) {
  // Get current product details
  const currentProduct = await safeQuery(() =>
    db.select().from(products).where(eq(products.id, productId)).limit(1)
  );

  if (!currentProduct || currentProduct.length === 0 || !currentProduct[0].categoryId) {
    return [];
  }

  const product = currentProduct[0];
  const priceMin = Number(product.price) * 0.8;
  const priceMax = Number(product.price) * 1.2;
  const categoryId = product.categoryId;

  if (!categoryId) {
    return [];
  }

  // Find similar products
  const similar = await safeQuery(() =>
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          lt(products.price, String(priceMax)),
          gt(products.price, String(priceMin)),
          sql`${products.id} != ${productId}`,
          gt(products.stock, 0)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(limit)
  );

  return similar || [];
}

// 2. Frequently Bought Together - based on order history
async function getFrequentlyBoughtTogether(productId: string, limit: number) {
  // Find orders containing this product
  const ordersWithProduct = await safeQuery(() =>
    db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
  );

  if (!ordersWithProduct || ordersWithProduct.length === 0) {
    // Fallback: return random products from same category
    return getSimilarProducts(productId, limit);
  }

  const orderIds = ordersWithProduct.map(o => o.orderId);

  // Find other products in those orders
  const coPurchased = await safeQuery(() =>
    db
      .select({
        productId: orderItems.productId,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(orderItems)
      .where(
        and(
          inArray(orderItems.orderId, orderIds),
          sql`${orderItems.productId} != ${productId}`
        )
      )
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit)
  );

  if (!coPurchased || coPurchased.length === 0) {
    return [];
  }

  // Get full product details
  const productIds = coPurchased.map(item => item.productId);
  const fullProducts = await safeQuery(() =>
    db.select().from(products).where(inArray(products.id, productIds))
  );

  return fullProducts || [];
}

// 3. New In Category - latest products in category
async function getNewInCategory(categoryId: string, limit: number) {
  const newProducts = await safeQuery(() =>
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          gt(products.stock, 0)
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(limit)
  );

  return newProducts || [];
}

// 4. Trending Products - most viewed in last 7 days
async function getTrendingProducts(limit: number) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get most viewed products
  const trending = await safeQuery(() =>
    db
      .select({
        productId: productViews.productId,
        viewCount: sql<number>`COUNT(*)`.as('view_count'),
      })
      .from(productViews)
      .where(gt(productViews.viewedAt, sevenDaysAgo))
      .groupBy(productViews.productId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit)
  );

  if (!trending || trending.length === 0) {
    // Fallback: featured products
    const featured = await safeQuery(() =>
      db
        .select()
        .from(products)
        .where(and(eq(products.featured, true), gt(products.stock, 0)))
        .orderBy(desc(products.createdAt))
        .limit(limit)
    );
    return featured || [];
  }

  // Get full product details
  const productIds = trending.map(item => item.productId);
  const fullProducts = await safeQuery(() =>
    db.select().from(products).where(inArray(products.id, productIds))
  );

  return fullProducts || [];
}

// 5. Curated Collection - admin-selected products
async function getCuratedCollection(slug: string, limit: number) {
  // Find collection
  const collection = await safeQuery(() =>
    db
      .select()
      .from(curatedCollections)
      .where(
        and(
          eq(curatedCollections.slug, slug),
          eq(curatedCollections.isActive, true)
        )
      )
      .limit(1)
  );

  if (!collection || collection.length === 0) {
    return [];
  }

  // Get collection items with products
  const items = await safeQuery(() =>
    db
      .select({
        product: products,
      })
      .from(collectionItems)
      .innerJoin(products, eq(collectionItems.productId, products.id))
      .where(eq(collectionItems.collectionId, collection[0].id))
      .orderBy(collectionItems.sortOrder)
      .limit(limit)
  );

  if (!items || items.length === 0) {
    return [];
  }

  return items.map(item => item.product);
}
