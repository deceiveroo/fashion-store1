import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productCategory } from '@/lib/schema';
import { productInStock, productFeatured } from '@/lib/product-query';
import { eq, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { canManageProducts } from '@/lib/admin-permissions';

async function requireProductManager() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 }) };
  }
  if (!canManageProducts(session.user.role)) {
    return { error: NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 }) };
  }
  return { session };
}

async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      lastError = error;
      const err = error as { message?: string; code?: string };
      const retryable =
        err.message?.includes('Connection terminated') ||
        err.message?.includes('ECONNRESET') ||
        err.code === 'ECONNRESET';
      if (retryable && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireProductManager();
    if ('error' in auth && auth.error) return auth.error;

    const { id } = await params;

    console.log('[admin/products GET] Fetching product:', id);

    // Отключаем кэширование для этого запроса

    const rows = await queryWithRetry(() =>
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          stock: products.stock,
          inStock: productInStock,
          featured: productFeatured,
          isNew: products.isNew,
          isActive: products.isActive,
          slug: products.slug,
          sku: products.sku,
          createdAt: products.createdAt,
        })
        .from(products)
        .where(eq(products.id, id))
        .limit(1)
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const product = rows[0];

    const images = await queryWithRetry(() =>
      db
        .select({ 
          id: productImages.id,
          url: productImages.url, 
          isMain: productImages.isMain, 
          order: productImages.order,
          mediaType: productImages.mediaType,
          duration: productImages.duration,
          thumbnailUrl: productImages.thumbnailUrl,
        })
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(productImages.order)
    );

    const categoryRows = await queryWithRetry(() =>
      db
        .select({ categoryId: productCategory.categoryId })
        .from(productCategory)
        .where(eq(productCategory.productId, id))
    );

    const categoryIds = categoryRows.map((r) => r.categoryId).filter(Boolean);

    console.log('[admin/products GET] Returning images:', images.map((img) => img.url));

    return NextResponse.json(
      {
        ...product,
        price: parseFloat(String(product.price ?? '0')) || 0,
        categories: categoryIds,
        images: images, // Возвращаем полные объекты, не только URL
        mainImage: images.find((img) => img.isMain)?.url ?? images[0]?.url ?? '/placeholder-image.jpg',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[admin/products GET]', error);
    return NextResponse.json({ error: 'Ошибка загрузки товара' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireProductManager();
    if ('error' in auth && auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing.length) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) patch.name = String(body.name);
    if (body.description !== undefined) patch.description = String(body.description);
    if (body.price !== undefined) patch.price = String(body.price);
    if (body.featured !== undefined) patch.featured = Boolean(body.featured);
    if (body.isNew !== undefined) patch.isNew = Boolean(body.isNew);
    if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);

    if (body.inStock !== undefined) {
      const inStock = Boolean(body.inStock);
      patch.inStock = inStock;
      const currentStock = Number(existing[0].stock) || 0;
      patch.stock = inStock ? Math.max(currentStock, 1) : 0;
    }

    if (body.stock !== undefined) {
      const stock = Math.max(0, Number(body.stock) || 0);
      patch.stock = stock;
      patch.inStock = stock > 0;
    }

    await db.update(products).set(patch).where(eq(products.id, id));

    return NextResponse.json({ success: true, message: 'Обновлено' });
  } catch (error) {
    console.error('[admin/products PATCH]', error);
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireProductManager();
    if ('error' in auth && auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      price,
      categories: categoryIdsRaw,
      categoryIds: categoryIdsAlt,
      inStock,
      featured,
      isNew,
      images,
    } = body;

    console.log('[admin/products PUT] Received images:', images);

    const categoryIds: string[] = (categoryIdsRaw ?? categoryIdsAlt ?? []).filter(Boolean);

    if (!name?.trim() || !description?.trim() || price === undefined || price === '') {
      return NextResponse.json({ error: 'Заполните название, описание и цену' }, { status: 400 });
    }

    const priceNum = parseFloat(String(price));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'Некорректная цена' }, { status: 400 });
    }

    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing.length) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    if (categoryIds.length > 0) {
      const { categories } = await import('@/lib/schema');
      const found = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.id, categoryIds));
      const foundIds = new Set(found.map((c) => c.id));
      const missing = categoryIds.filter((cid) => !foundIds.has(cid));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Категории не найдены: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const stockValue =
      inStock !== undefined
        ? inStock
          ? Math.max(Number(existing[0].stock) || 10, 1)
          : 0
        : Number(existing[0].stock) || 0;

    await db
      .update(products)
      .set({
        name: String(name).trim(),
        description: String(description).trim(),
        price: String(priceNum),
        inStock: stockValue > 0,
        stock: stockValue,
        featured: featured !== undefined ? Boolean(featured) : existing[0].featured,
        isNew: isNew !== undefined ? Boolean(isNew) : existing[0].isNew,
        categoryId: categoryIds[0] ?? existing[0].categoryId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    await db.delete(productCategory).where(eq(productCategory.productId, id));

    if (categoryIds.length > 0) {
      await db.insert(productCategory).values(
        categoryIds.map((categoryId: string) => ({
          id: crypto.randomUUID(),
          productId: id,
          categoryId,
        }))
      );
    }

    await db.delete(productImages).where(eq(productImages.productId, id));

    // Обрабатываем изображения/видео - могут быть строки или объекты
    const mediaItems: Array<{
      url: string;
      mediaType?: 'image' | 'video';
      duration?: number;
      thumbnailUrl?: string;
    }> = Array.isArray(images)
      ? images.map((img: string | { url: string; mediaType?: string; duration?: number; thumbnailUrl?: string }) => {
          if (typeof img === 'string') {
            return { url: img, mediaType: 'image' as const };
          }
          return {
            url: img.url,
            mediaType: (img.mediaType as 'image' | 'video') || 'image',
            duration: img.duration,
            thumbnailUrl: img.thumbnailUrl,
          };
        }).filter(item => item.url)
      : [];

    if (mediaItems.length > 0) {
      console.log('[admin/products PUT] Saving media:', mediaItems);
      await db.insert(productImages).values(
        mediaItems.map((item, index) => ({
          id: `${id}-media-${index}-${crypto.randomUUID().slice(0, 8)}`,
          productId: id,
          url: item.url,
          isMain: index === 0,
          order: index,
          mediaType: item.mediaType || 'image',
          duration: item.duration || null,
          thumbnailUrl: item.thumbnailUrl || null,
        }))
      );
      console.log('[admin/products PUT] Media saved successfully');
    } else {
      console.log('[admin/products PUT] No media to save');
    }

    return NextResponse.json({ success: true, message: 'Товар сохранён' });
  } catch (error) {
    console.error('[admin/products PUT]', error);
    const message = error instanceof Error ? error.message : 'Ошибка сохранения';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireProductManager();
    if ('error' in auth && auth.error) return auth.error;

    const { id } = await params;
    const { searchParams } = new URL(_request.url);
    const hard = searchParams.get('hard') === 'true';

    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing.length) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    if (hard) {
      await db.delete(productCategory).where(eq(productCategory.productId, id));
      await db.delete(productImages).where(eq(productImages.productId, id));
      await db.delete(products).where(eq(products.id, id));
    } else {
      await db
        .update(products)
        .set({
          isActive: false,
          deletedAt: new Date(),
          stock: 0,
          inStock: false,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));
    }

    return NextResponse.json({ success: true, message: hard ? 'Товар удалён' : 'Товар скрыт из каталога' });
  } catch (error) {
    console.error('[admin/products DELETE]', error);
    const message = error instanceof Error ? error.message : 'Ошибка удаления';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
