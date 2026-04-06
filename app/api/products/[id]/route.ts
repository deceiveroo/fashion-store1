import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productCategory, categories } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { canManageProducts } from '@/lib/admin-permissions';
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
          inStock: products.inStock,
          featured: products.featured,
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
      .filter(item => item.imageId)
      .map(item => ({
        id: item.imageId!,
        url: item.imageUrl,
        isMain: item.imageIsMain ?? false,
        order: item.imageOrder,
      }));

    const product = {
      id: firstProduct.id,
      name: firstProduct.name,
      description: firstProduct.description,
      price: firstProduct.price,
      inStock: firstProduct.inStock ?? true,
      featured: firstProduct.featured ?? false,
      createdAt: firstProduct.createdAt,
      images,
      mainImage: images.find(img => img.isMain)?.url || 
                 images[0]?.url || 
                 '/placeholder-image.jpg'
    };

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем, является ли пользователь администратором
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canManageProducts(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Обновление продукта
    const [updatedProduct] = await queryWithRetry(() =>
      db
        .update(products)
        .set({
          name: data.name,
          description: data.description,
          price: data.price,
          inStock: data.inStock ?? true,
          featured: data.featured ?? false,
          position: data.position ?? 0,
          isFeatured: data.isFeatured ?? false,
          locale: data.locale || 'ru',
          meta: data.meta || null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning()
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Обновление изображений если предоставлены
    if (data.images && Array.isArray(data.images)) {
      // Сначала удаляем старые изображения
      await queryWithRetry(() =>
        db.delete(productImages).where(eq(productImages.productId, id))
      );

      // Затем добавляем новые
      const imageValues = data.images.map((image: any) => ({
        id: image.id || uuidv4(),
        productId: id,
        url: image.url,
        isMain: image.isMain || false,
        order: image.order || 0,
      }));

      if (imageValues.length > 0) {
        await queryWithRetry(() =>
          db.insert(productImages).values(imageValues)
        );
      }
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем, является ли пользователь администратором
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

    // Удаляем продукт (каскадно удалятся связанные записи благодаря настройкам внешних ключей)
    await queryWithRetry(() =>
      db.delete(products).where(eq(products.id, id)).returning()
    );

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}