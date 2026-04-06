// app/api/debug-products/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .leftJoin(productImages, productImages.productId === products.id);
    
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
