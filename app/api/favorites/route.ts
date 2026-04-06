import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userWishlistItems, products, productImages } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';

// Helper function with retry logic
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
        error.message?.includes('Pool is draining') ||
        error.message?.includes('Query read timeout') ||
        error.code === 'ECONNRESET';
      
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Query failed (attempt ${i + 1}), retrying...`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

// GET - получение избранного пользователя
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем список избранных товаров пользователя
    const userFavorites = await queryWithRetry(() =>
      db
        .select()
        .from(userWishlistItems)
        .where(eq(userWishlistItems.userId, session.user.id))
    );

    if (userFavorites.length === 0) {
      return NextResponse.json([]);
    }

    // Получаем ID всех избранных товаров
    const favoriteProductIds = userFavorites.map(fav => fav.productId);

    // Получаем полную информацию о каждом избранном товаре
    const favoriteProducts = await queryWithRetry(() =>
      db
        .select()
        .from(products)
        .where(inArray(products.id, favoriteProductIds))
    );

    // Получаем изображения для всех избранных товаров
    const allImages = await queryWithRetry(() =>
      db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, favoriteProductIds))
        .orderBy(productImages.order)
    );

    // Формируем финальный список с полной информацией
    const result = favoriteProducts.map(product => {
      const productImages = allImages.filter(img => img.productId === product.id);
      const mainImage = productImages.find(img => img.isMain)?.url || 
                       productImages[0]?.url || 
                       '/placeholder-image.jpg';
      
      return {
        ...product,
        image: mainImage,
        category: 'Избранное' // Заглушка, можно улучшить при необходимости
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    
    // Если таблица не существует, возвращаем пустой массив
    if (error.message?.includes('relation "user_wishlist_items" does not exist') ||
        error.message?.includes('table') && error.message?.includes('does not exist')) {
      console.warn('⚠️ Table user_wishlist_items does not exist. Please run the migration.');
      return NextResponse.json([]);
    }
    
    return NextResponse.json({ error: 'Error fetching favorites' }, { status: 500 });
  }
}

// POST - добавление в избранное
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Проверяем, не добавлен ли уже товар
    const existingFavorite = await queryWithRetry(() =>
      db
        .select()
        .from(userWishlistItems)
        .where(
          and(
            eq(userWishlistItems.userId, session.user.id),
            eq(userWishlistItems.productId, productId)
          )
        )
        .limit(1)
    );

    if (existingFavorite.length > 0) {
      return NextResponse.json({ message: 'Product already in favorites' }, { status: 400 });
    }

    // Добавляем в избранное
    await queryWithRetry(() =>
      db.insert(userWishlistItems).values({
        id: uuidv4(),
        userId: session.user.id,
        productId: productId,
      })
    );

    return NextResponse.json({ message: 'Product added to favorites' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json({ error: 'Error adding to favorites' }, { status: 500 });
  }
}