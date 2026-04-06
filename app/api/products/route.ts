import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productCategory, categories } from '@/lib/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { checkCanManageProducts } from '@/lib/server-auth';
import { v4 as uuidv4 } from 'uuid';

// Helper function with retry logic for Supabase pooler
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('Pool is draining and cannot accept new connections') ||
        error.code === 'ECONNRESET';
      
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Query failed (attempt ${i + 1}), retrying...`, error.message);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Оптимизированный запрос с подзапросами вместо JOIN
    const filteredProducts = await queryWithRetry(() =>
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          inStock: products.inStock,
          featured: products.featured,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset)
    );
    
    // Получаем только главные изображения одним запросом
    const productIds = filteredProducts.map(p => p.id);
    let mainImages: any[] = [];
    
    if (productIds.length > 0) {
      mainImages = await queryWithRetry(() =>
        db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(and(
            inArray(productImages.productId, productIds),
            eq(productImages.isMain, true)
          ))
      );
    }
    
    // Создаем map для быстрого доступа
    const mainImageMap = mainImages.reduce((acc, img) => {
      acc[img.productId] = img.url;
      return acc;
    }, {} as Record<string, string>);

    // Формируем ответ
    const productsWithImages = filteredProducts.map((product) => {
      const priceNum = parseFloat(String(product.price ?? '0'));
      return {
        ...product,
        categories: [] as string[],
        price: Number.isFinite(priceNum) ? priceNum : 0,
        inStock: product.inStock ?? true,
        featured: product.featured ?? false,
        images: [],
        mainImage: mainImageMap[product.id] || '/placeholder-image.jpg'
      };
    });

    return NextResponse.json(productsWithImages);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkCanManageProducts())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Валидация данных
    if (!data.name || !data.description || !data.price) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price' },
        { status: 400 }
      );
    }

    const id = data.id || uuidv4();
    const slugBase = String(data.slug || data.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-|-$/g, '') || 'product';
    const slug = data.slug || `${slugBase}-${id.slice(0, 8)}`;
    const sku = data.sku || `SKU-${id.replace(/-/g, '').slice(0, 14)}`;

    const [newProduct] = await db
      .insert(products)
      .values({
        id,
        name: data.name,
        description: data.description,
        slug,
        sku,
        price: String(data.price),
        inStock: data.inStock ?? true,
        featured: data.featured ?? false,
      })
      .returning();

    // Добавление категорий если указаны
    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      const categoryLinks = data.categoryIds.map((categoryId: string) => ({
        id: uuidv4(),
        productId: newProduct.id,
        categoryId,
      }));

      if (categoryLinks.length > 0) {
        await db.insert(productCategory).values(categoryLinks);
      }
    }

    // Добавление изображений если указаны
    if (data.images && Array.isArray(data.images)) {
      const imageValues = data.images.map((image: any) => ({
        id: image.id || uuidv4(),
        productId: newProduct.id,
        url: image.url,
        isMain: image.isMain || false,
        order: image.order || 0,
      }));

      if (imageValues.length > 0) {
        await db.insert(productImages).values(imageValues);
      }
    }

    return NextResponse.json(newProduct);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  }
}