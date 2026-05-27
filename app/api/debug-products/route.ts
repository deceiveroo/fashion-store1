// app/api/debug-products/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { debugRouteGuard } from '@/lib/debug-guard';

export async function GET(_request: NextRequest) {
  const blocked = await debugRouteGuard();
  if (blocked) return blocked;
  try {
    const allProducts = await db
      .select()
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id));

    return new Response(JSON.stringify(allProducts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch products with images' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
