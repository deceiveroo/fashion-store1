import { NextRequest, NextResponse } from 'next/server';export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Delete favorite item with retry logic
    await queryWithRetry(async () => {
      await db
        .delete(userWishlistItems)
        .where(
          and(
            eq(userWishlistItems.userId, session.user.id),
            eq(userWishlistItems.productId, productId)
          )
        );
    });

    return NextResponse.json({ message: 'Favorite removed' });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    
    if (error.message?.includes('Connection terminated') || 
        error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to remove favorite' }, 
      { status: 500 }
    );
  }
}
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { userWishlistItems, products, productImages } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Функция с повторными попытками для надежной работы с базой данных
async function queryWithRetry<T>(queryFn: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') || 
        error.message?.includes('timeout') || 
        error.message?.includes('Connection pool is closed') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND';

      if (isConnectionError && i < maxRetries - 1) {
        console.log(`Database connection attempt ${i + 1} failed, retrying in ${Math.pow(2, i)} seconds...`);
        // Ждем перед повторной попыткой (экспоненциальная задержка)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      } else {
        // Если это не ошибка подключения или это последняя попытка
        throw error;
      }
    }
  }

  throw lastError;
}

// GET - получение избранного пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's favorite items with retry logic
    const favorites = await queryWithRetry(async () => {
      return await db
        .select()
        .from(userWishlistItems)
        .where(eq(userWishlistItems.userId, session.user.id));
    });

    // Получаем ID всех избранных товаров
    const favoriteProductIds = favorites.map(fav => fav.productId);

    if (favoriteProductIds.length === 0) {
      return NextResponse.json([]);
    }

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
    
    if (error.message?.includes('Connection terminated') || 
        error.message?.includes('timeout') || 
        error.message?.includes('Connection pool is closed')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' }, 
        { status: 503 }
      );
    }
    
    // Если таблица не существует, возвращаем пустой массив
    if (error.message?.includes('relation "user_wishlist_items" does not exist') ||
        error.message?.includes('table') && error.message?.includes('does not exist')) {
      console.warn('⚠️ Table user_wishlist_items does not exist. Please run the migration.');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favorites' }, 
      { status: 500 }
    );
  }
}

// POST - добавление в избранное
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if item already exists
    const existingFavorite = await queryWithRetry(async () => {
      return await db
        .select()
        .from(userWishlistItems)
        .where(
          and(
            eq(userWishlistItems.userId, session.user.id),
            eq(userWishlistItems.productId, productId)
          )
        )
        .limit(1);
    });

    if (existingFavorite.length > 0) {
      return NextResponse.json({ message: 'Product already in favorites' }, { status: 400 });
    }

    // Add favorite item with retry logic
    const result = await queryWithRetry(async () => {
      const [favorite] = await db
        .insert(userWishlistItems)
        .values({
          userId: session.user.id,
          productId,
        })
        .returning();
      return favorite;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    
    if (error.message?.includes('Connection terminated') || 
        error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to add favorite' }, 
      { status: 500 }
    );
  }
}