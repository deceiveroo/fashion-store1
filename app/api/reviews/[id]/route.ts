import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// GET /api/reviews/[id] - Получить конкретный отзыв
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews/[id] - Обновить свой отзыв
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, title, comment, images } = body;

    // Проверяем существование отзыва
    const existingReview = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Проверяем, что это отзыв текущего пользователя
    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own reviews' },
        { status: 403 }
      );
    }

    // Валидация
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (comment && comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Обновляем отзыв
    const [updatedReview] = await db
      .update(reviews)
      .set({
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment && { comment }),
        ...(images !== undefined && { images }),
        updatedAt: new Date(),
        // После обновления отзыв требует повторной модерации
        isApproved: false,
      })
      .where(eq(reviews.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Review updated successfully. It will be visible again after moderation.',
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Удалить свой отзыв
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем существование отзыва
    const existingReview = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Проверяем, что это отзыв текущего пользователя или админ
    const isAdmin = session.user.role === 'admin' || session.user.role === 'manager';
    if (existingReview.userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Удаляем отзыв
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
