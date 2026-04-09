import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, categories } from '@/lib/db/schema';
import { or, like, eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchPattern = `%${query.toLowerCase()}%`;

    // Search in products by name and description
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: products.inStock,
        categoryId: products.categoryId,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .where(
        or(
          sql`LOWER(${products.name}) LIKE ${searchPattern}`,
          sql`LOWER(${products.description}) LIKE ${searchPattern}`
        )
      )
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(8);

    // Get unique products with their first image
    const uniqueProducts = new Map();
    for (const item of results) {
      if (!uniqueProducts.has(item.id)) {
        uniqueProducts.set(item.id, {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price || '0'),
          image: item.imageUrl || '',
          inStock: item.inStock,
        });
      }
    }

    // Get category names if needed
    const productsArray = Array.from(uniqueProducts.values());
    
    // Get categories for products
    const categoryIds = [...new Set(results.map(r => r.categoryId).filter(Boolean))];
    if (categoryIds.length > 0) {
      const cats = await db
        .select()
        .from(categories)
        .where(sql`${categories.id} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})`);
      
      const categoryMap = new Map(cats.map(c => [c.id, c.name]));
      
      // Add category names to products
      for (const product of productsArray) {
        const result = results.find(r => r.id === product.id);
        if (result?.categoryId) {
          product.category = categoryMap.get(result.categoryId);
        }
      }
    }

    return NextResponse.json({ suggestions: productsArray });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
