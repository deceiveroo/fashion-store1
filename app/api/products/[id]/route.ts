import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productCategory } from '@/lib/schema';
import { productInStock, productFeatured } from '@/lib/product-query';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { canManageProducts } from '@/lib/admin-permissions';
import { v4 as uuidv4 } from 'uuid';

async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      lastError = error;
      const err = error as { message?: string; code?: string };
      const isConnectionError =
        err.message?.includes('Connection terminated') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('Pool is draining') ||
        err.code === 'ECONNRESET';
      if (isConnectionError && i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => (typeof img === 'string' ? img : (img as { url?: string })?.url))
    .filter((url): url is string => !!url && url.trim().length > 0);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productData = await queryWithRetry(() =>
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          inStock: productInStock,
          featured: productFeatured,
          createdAt: products.createdAt,
          imageId: productImages.id,
          imageUrl: productImages.url,
          imageIsMain: productImages.isMain,
          imageOrder: productImages.order,
        })
        .from(products)
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(products.id, id))
        .orderBy(productImages.order)
    );

    if (productData.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const firstProduct = productData[0];
    const images = productData
      .filter((item) => item.imageId && item.imageUrl)
      .map((item) => ({
        id: item.imageId!,
        url: item.imageUrl!,
        isMain: item.imageIsMain ?? false,
        order: item.imageOrder,
      }));

    return NextResponse.json({
      id: firstProduct.id,
      name: firstProduct.name,
      description: firstProduct.description,
      price: parseFloat(String(firstProduct.price ?? '0')),
      inStock: firstProduct.inStock ?? true,
      featured: firstProduct.featured ?? false,
      createdAt: firstProduct.createdAt,
      images: images.map((i) => i.url),
      mainImage:
        images.find((img) => img.isMain)?.url || images[0]?.url || '/placeholder-image.jpg',
    });
  } catch (error: unknown) {
    console.error('Error fetching product:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch product', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageProducts(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const imageUrls = normalizeImages(data.images);
    const categoryIds: string[] = Array.isArray(data.categories) ? data.categories : [];
    const inStock = data.inStock !== false;
    const stock = inStock ? Math.max(Number(data.stock) || 10, 1) : 0;

    const [updatedProduct] = await queryWithRetry(() =>
      db
        .update(products)
        .set({
          name: data.name,
          description: data.description,
          price: String(data.price),
          inStock,
          featured: Boolean(data.featured),
          stock,
          categoryId: categoryIds[0] || null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning()
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await queryWithRetry(() => db.delete(productImages).where(eq(productImages.productId, id)));

    const urls = imageUrls.length > 0 ? imageUrls : ['/placeholder-image.jpg'];
    await queryWithRetry(() =>
      db.insert(productImages).values(
        urls.map((url, index) => ({
          id: uuidv4(),
          productId: id,
          url,
          isMain: index === 0,
          order: index,
        }))
      )
    );

    await queryWithRetry(() => db.delete(productCategory).where(eq(productCategory.productId, id)));

    if (categoryIds.length > 0) {
      await queryWithRetry(() =>
        db.insert(productCategory).values(
          categoryIds.map((categoryId) => ({
            id: uuidv4(),
            productId: id,
            categoryId,
          }))
        )
      );
    }

    return NextResponse.json({ message: 'Product updated', product: updatedProduct });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to update product', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageProducts(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await queryWithRetry(() => db.delete(productCategory).where(eq(productCategory.productId, id)));
    await queryWithRetry(() => db.delete(productImages).where(eq(productImages.productId, id)));

    const deleted = await queryWithRetry(() =>
      db.delete(products).where(eq(products.id, id)).returning({ id: products.id })
    );

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete product', details: errorMessage }, { status: 500 });
  }
}
