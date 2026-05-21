import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, users, orders, orderItems, products, userProfiles } from '@/lib/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { awardXP, checkAchievements } from '@/lib/gamification';

// GET /api/reviews - Получить отзывы для товара
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const ratingFilter = searchParams.get('rating');
    const verifiedOnly = searchParams.get('verified') === 'true';

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Строим условия фильтрации
    let conditions = [eq(reviews.productId, productId), eq(reviews.isApproved, true)];
    
    if (ratingFilter) {
      conditions.push(eq(reviews.rating, parseInt(ratingFilter)));
    }
    
    if (verifiedOnly) {
      conditions.push(eq(reviews.isVerifiedPurchase, true));
    }

    // Сортировка
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = asc(reviews.createdAt);
        break;
      case 'highest':
        orderBy = desc(reviews.rating);
        break;
      case 'lowest':
        orderBy = asc(reviews.rating);
        break;
      case 'helpful':
        orderBy = desc(reviews.helpfulCount);
        break;
      default:
        orderBy = desc(reviews.createdAt);
    }

    // Получаем общее количество
    const totalCountResult = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(...conditions));
    
    const totalCount = totalCountResult[0]?.count || 0;

    // Получаем отзывы с информацией о пользователе
    const reviewsList = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        images: reviews.images,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        helpfulCount: reviews.helpfulCount,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        adminResponse: reviews.adminResponse,
        adminRespondedAt: reviews.adminRespondedAt,
        userName: users.name,
        userAvatar: userProfiles.avatar,
        userImage: users.image,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(userProfiles, eq(reviews.userId, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    // Статистика по рейтингам
    const ratingStats = await db
      .select({
        rating: reviews.rating,
        count: count(),
      })
      .from(reviews)
      .where(and(...conditions))
      .groupBy(reviews.rating);

    // Рассчитываем средний рейтинг
    const totalRatings = ratingStats.reduce((sum, stat) => sum + (stat.count * (stat.rating || 0)), 0);
    const averageRating = totalCount > 0 ? totalRatings / totalCount : 0;

    // Создаем distribution объект
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    
    ratingStats.forEach((stat) => {
      if (stat.rating && stat.rating >= 1 && stat.rating <= 5) {
        distribution[stat.rating as keyof typeof distribution] = Number(stat.count);
      }
    });

    return NextResponse.json({
      reviews: reviewsList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      statistics: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalCount,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Создать новый отзыв
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, title, comment, images } = body;

    // Валидация
    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Product ID and rating (1-5) are required' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Проверка: существует ли товар
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Проверка: уже есть ли отзыв от этого пользователя на этот товар
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, session.user.id),
        eq(reviews.productId, productId)
      ),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product. Please update your existing review.' },
        { status: 409 }
      );
    }

    // Проверка верификации покупки (есть ли заказ с этим товаром)
    let isVerifiedPurchase = false;
    let relatedOrderId = null;

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, session.user.id),
      with: {
        items: true,
      },
    });

    // Статусы заказов которые считаются как "куплено"
    // delivered - доставлен, shipped - отправлен, processing - в обработке
    const validOrderStatuses = ['delivered', 'shipped', 'processing'];

    for (const order of userOrders) {
      const hasProduct = order.items?.some((item) => item.productId === productId);
      // Проверяем что заказ не отменен и не возвращен
      if (hasProduct && validOrderStatuses.includes(order.status)) {
        isVerifiedPurchase = true;
        relatedOrderId = order.id;
        break;
      }
    }

    // ВАЖНО: Если пользователь НЕ покупал этот товар, блокируем создание отзыва
    // Это предотвращает фейковые отзывы
    if (!isVerifiedPurchase) {
      return NextResponse.json(
        { 
          error: 'Вы можете оставить отзыв только на товары, которые купили. Отзыв будет доступен после доставки заказа.' 
        },
        { status: 403 }
      );
    }

    // Создаем отзыв (по умолчанию не одобрен, требует модерации)
    const [newReview] = await db
      .insert(reviews)
      .values({
        userId: session.user.id,
        productId,
        orderId: relatedOrderId,
        rating,
        title: title || null,
        comment,
        images: images || [],
        isVerifiedPurchase,
        isApproved: false, // Требует модерации
        locale: 'ru',
      })
      .returning();

    // Начисляем XP за отзыв
    const xpAmount = images && images.length > 0 ? 75 : 50; // Больше XP за фото
    await awardXP(session.user.id, xpAmount, 'Отзыв на товар', {
      reviewId: newReview.id,
      productId,
      hasImages: images && images.length > 0,
    });

    // Проверяем достижения
    await checkAchievements(session.user.id, 'review_submitted');

    return NextResponse.json(
      {
        success: true,
        review: newReview,
        message: 'Отзыв успешно создан! Он появится после модерации.',
        xpAwarded: xpAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
