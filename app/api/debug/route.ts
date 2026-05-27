// app/api/debug/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';  // Updated import path
import { debugRouteGuard } from '@/lib/debug-guard';

export async function GET() {
  const blocked = await debugRouteGuard();
  if (blocked) return blocked;
  try {
    const allProducts = await db.select().from(products);
    return new Response(JSON.stringify(allProducts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch products' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
