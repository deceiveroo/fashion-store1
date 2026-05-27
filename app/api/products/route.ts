import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productCategory, productSizes } from '@/lib/schema';
import { productListSelect } from '@/lib/product-query';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { checkCanManageProducts } from '@/lib/server-auth';
import { v4 as uuidv4 } from 'uuid';

// Helper function with retry logic for Supabase pooler
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;
      
      const isConnectionError = 
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('Pool is draining and cannot accept new connections') ||
        errorCode === 'ECONNRESET';
      
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
        .select(productListSelect)
        .from(products)
        .where(eq(products.isActive, true)) // Только активные товары
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
        isNew: product.isNew ?? false,
        images: [],
        mainImage: mainImageMap[product.id] || '/placeholder-image.jpg'
      };
    });

    const response = NextResponse.json(productsWithImages);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: errorMessage },
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

    if (!data.name?.trim() || !data.description?.trim() || data.price === undefined) {
      return NextResponse.json(
        { error: 'Заполните название, описание и цену' },
        { status: 400 }
      );
    }

    const priceNum = parseFloat(String(data.price));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'Некорректная цена' }, { status: 400 });
    }

    const categoryIds: string[] = (
      data.categoryIds ??
      data.categories ??
      []
    ).filter(Boolean);

    if (categoryIds.length === 0) {
      return NextResponse.json({ error: 'Выберите хотя бы одну категорию' }, { status: 400 });
    }

    const id = data.id || uuidv4();
    const slugBase = String(data.slug || data.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-|-$/g, '') || 'product';
    const slug = data.slug || `${slugBase}-${id.slice(0, 8)}`;
    const sku = data.sku || `SKU-${id.replace(/-/g, '').slice(0, 14)}`;
    const inStock = data.inStock !== false;
    const stock = inStock ? Math.max(Number(data.stock) || 10, 1) : 0;

    const [newProduct] = await db
      .insert(products)
      .values({
        id,
        name: String(data.name).trim(),
        description: String(data.description).trim(),
        slug,
        sku,
        price: String(priceNum),
        stock,
        inStock: stock > 0,
        featured: Boolean(data.featured),
        isNew: Boolean(data.isNew),
        isActive: true,
        categoryId: categoryIds[0],
        // Новые поля
        brand: data.brand || null,
        country: data.country || null,
        composition: data.composition || null,
        compositionSecondary: data.compositionSecondary || null,
        color: data.color || null,
        articleNumber: data.articleNumber || null,
        productCode: data.productCode || null,
        modelParams: data.modelParams || null,
      })
      .returning();

    const categoryLinks = categoryIds.map((categoryId: string) => ({
      id: uuidv4(),
      productId: newProduct.id,
      categoryId,
    }));
    await db.insert(productCategory).values(categoryLinks);

    const rawImages: unknown[] = Array.isArray(data.images) ? data.images : [];
    const imageUrls = rawImages
      .map((image) => (typeof image === 'string' ? image : (image as { url?: string })?.url))
      .filter((url): url is string => Boolean(url));

    if (imageUrls.length > 0) {
      await db.insert(productImages).values(
        imageUrls.map((url, index) => ({
          id: uuidv4(),
          productId: newProduct.id,
          url,
          isMain: index === 0,
          order: index,
        }))
      );
    }

    // Сохраняем размеры
    const sizesData = data.sizes;
    if (sizesData && Array.isArray(sizesData) && sizesData.length > 0) {
      console.log('[POST /api/products] Saving sizes:', sizesData);
      await db.insert(productSizes).values(
        sizesData.map((size: any, index: number) => ({
          id: uuidv4(),
          productId: newProduct.id,
          sizeName: size.sizeName || size.size_name,
          sizeType: size.sizeType || size.size_type || 'international',
          inStock: size.inStock !== undefined ? size.inStock : size.in_stock !== undefined ? size.in_stock : true,
          stockCount: size.stockCount || size.stock_count || 0,
          sortOrder: size.sortOrder || index,
        }))
      );
      console.log('[POST /api/products] Sizes saved successfully');
    }

    return NextResponse.json(newProduct);
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create product', details: errorMessage },
      { status: 500 }
    );
  }
}