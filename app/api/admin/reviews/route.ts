import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, users, products } from '@/lib/schema';
import { eq, desc, and, or, ilike } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/admin/reviews - Получить все отзывы для модерации
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // pending, approved, rejected
    const search = searchParams.get('search');

    let conditions = [];

    // Фильтр по статусу
    if (status === 'pending') {
      conditions.push(eq(reviews.isApproved, false));
    } else if (status === 'approved') {
      conditions.push(eq(reviews.isApproved, true));
    }

    // Поиск по тексту отзыва или имени пользователя
    if (search) {
      conditions.push(
        or(
          ilike(reviews.comment, `%${search}%`),
          ilike(reviews.title, `%${search}%`)
        )
      );
    }

    const offset = (page - 1) * limit;

    // Получаем отзывы с информацией о пользователе и товаре
    const reviewsList = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        productId: reviews.productId,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        images: reviews.images,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        isApproved: reviews.isApproved,
        helpfulCount: reviews.helpfulCount,
        adminResponse: reviews.adminResponse,
        createdAt: reviews.createdAt,
        userName: users.name,
        userEmail: users.email,
        productName: products.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Общее количество
    const [{ totalCount }] = await db
      .select({ totalCount: db.$count(reviews, conditions.length > 0 ? and(...conditions) : undefined) })
      .from(reviews);

    // Статистика
    const [pendingCount, approvedCount] = await Promise.all([
      db.select({ count: db.$count(reviews, eq(reviews.isApproved, false)) }).from(reviews),
      db.select({ count: db.$count(reviews, eq(reviews.isApproved, true)) }).from(reviews),
    ]);

    return NextResponse.json({
      reviews: reviewsList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        pending: pendingCount[0].count,
        approved: approvedCount[0].count,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/admin/reviews/[id]/approve - Одобрить отзыв
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [updatedReview] = await db
      .update(reviews)
      .set({
        isApproved: true,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    if (!updatedReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Review approved successfully',
    });
  } catch (error) {
    console.error('Error approving review:', error);
    return NextResponse.json(
      { error: 'Failed to approve review' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id]/reject - Отклонить/удалить отзыв
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(reviews).where(eq(reviews.id, id));

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews/[id]/respond - Ответить на отзыв
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { response } = body;

    if (!response || response.trim().length < 5) {
      return NextResponse.json(
        { error: 'Response must be at least 5 characters long' },
        { status: 400 }
      );
    }

    const [updatedReview] = await db
      .update(reviews)
      .set({
        adminResponse: response,
        adminRespondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    if (!updatedReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Response added successfully',
    });
  } catch (error) {
    console.error('Error responding to review:', error);
    return NextResponse.json(
      { error: 'Failed to add response' },
      { status: 500 }
    );
  }
}
