import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, categories, productCategory } from '@/lib/db/schema';
import { or, like, eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ products: [] });
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
        featured: products.featured,
        createdAt: products.createdAt,
        imageUrl: productImages.url,
        imageIsMain: productImages.isMain,
      })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .where(
        or(
          sql`LOWER(${products.name}) LIKE ${searchPattern}`,
          sql`LOWER(${products.description}) LIKE ${searchPattern}`
        )
      )
      .orderBy(desc(products.featured), desc(products.createdAt));

    // Group products and get main image
    const productMap = new Map();
    for (const item of results) {
      if (!productMap.has(item.id)) {
        productMap.set(item.id, {
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price || '0'),
          inStock: item.inStock,
          mainImage: '',
          categories: [],
        });
      }

      const product = productMap.get(item.id);
      
      // Set main image
      if (item.imageUrl && !product.mainImage) {
        if (item.imageIsMain) {
          product.mainImage = item.imageUrl;
        } else if (!product.mainImage) {
          product.mainImage = item.imageUrl;
        }
      }
    }

    const productsArray = Array.from(productMap.values());

    // Get categories for each product
    for (const product of productsArray) {
      const productCats = await db
        .select({
          categoryName: categories.name,
        })
        .from(productCategory)
        .leftJoin(categories, eq(productCategory.categoryId, categories.id))
        .where(eq(productCategory.productId, product.id));

      product.categories = productCats
        .map(pc => pc.categoryName)
        .filter(Boolean);
    }

    return NextResponse.json({ products: productsArray });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
