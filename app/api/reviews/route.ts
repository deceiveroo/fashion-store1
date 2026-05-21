import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, orders, orderItems, products } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { awardXP, checkAchievements } from '@/lib/gamification';

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

    for (const order of userOrders) {
      const hasProduct = order.items?.some((item) => item.productId === productId);
      if (hasProduct && order.status === 'delivered') {
        isVerifiedPurchase = true;
        relatedOrderId = order.id;
        break;
      }
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
        message: isVerifiedPurchase
          ? 'Review submitted successfully! It will be visible after moderation.'
          : 'Review submitted successfully! Verified purchase badge will be added once your order is delivered.',
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
