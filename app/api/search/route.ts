import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, categories, productCategory } from '@/lib/schema';
import { productInStock, productFeatured } from '@/lib/product-query';
import { or, eq, desc, sql, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ products: [] });
    }

    const searchPattern = `%${query.toLowerCase()}%`;

    // Search in products by name and description (limited to prevent runaway queries)
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: productInStock,
        featured: productFeatured,
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
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(200);

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
    const productIds = productsArray.map(p => p.id);

    // Batch-fetch categories for all products in a single query (was N+1)
    if (productIds.length > 0) {
      const allCategories = await db
        .select({
          productId: productCategory.productId,
          categoryName: categories.name,
        })
        .from(productCategory)
        .leftJoin(categories, eq(productCategory.categoryId, categories.id))
        .where(inArray(productCategory.productId, productIds));

      const categoriesByProduct = new Map<string, string[]>();
      for (const row of allCategories) {
        if (!row.categoryName) continue;
        const list = categoriesByProduct.get(row.productId) || [];
        list.push(row.categoryName);
        categoriesByProduct.set(row.productId, list);
      }

      for (const product of productsArray) {
        product.categories = categoriesByProduct.get(product.id) || [];
      }
    }

    const response = NextResponse.json({ products: productsArray });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
