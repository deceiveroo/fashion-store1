import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, reviewHelpfulVotes } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

// POST /api/reviews/[id]/helpful - Отметить отзыв как полезный
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Проверяем существование отзыва
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Проверяем, не голосовал ли пользователь уже за этот отзыв
    const existingVote = await db.query.reviewHelpfulVotes.findFirst({
      where: and(
        eq(reviewHelpfulVotes.reviewId, id),
        eq(reviewHelpfulVotes.userId, userId)
      ),
    });

    if (existingVote) {
      // Если уже голосовал - удаляем голос (toggle)
      await db
        .delete(reviewHelpfulVotes)
        .where(
          and(
            eq(reviewHelpfulVotes.reviewId, id),
            eq(reviewHelpfulVotes.userId, userId)
          )
        );

      // Уменьшаем счетчик helpfulCount
      await db
        .update(reviews)
        .set({
          helpfulCount: Math.max(0, (review.helpfulCount || 0) - 1),
        })
        .where(eq(reviews.id, id));

      return NextResponse.json({
        success: true,
        action: 'removed',
        helpfulCount: Math.max(0, (review.helpfulCount || 0) - 1),
        message: 'Vote removed',
      });
    } else {
      // Добавляем новый голос
      await db.insert(reviewHelpfulVotes).values({
        reviewId: id,
        userId,
      });

      // Увеличиваем счетчик helpfulCount
      await db
        .update(reviews)
        .set({
          helpfulCount: (review.helpfulCount || 0) + 1,
        })
        .where(eq(reviews.id, id));

      return NextResponse.json({
        success: true,
        action: 'added',
        helpfulCount: (review.helpfulCount || 0) + 1,
        message: 'Review marked as helpful',
      });
    }
  } catch (error) {
    console.error('Error toggling helpful vote:', error);
    return NextResponse.json(
      { error: 'Failed to update helpful vote' },
      { status: 500 }
    );
  }
}

// GET /api/reviews/[id]/helpful - Проверить, проголосовал ли пользователь
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ voted: false });
    }

    const { id } = await params;
    const userId = session.user.id;

    const vote = await db.query.reviewHelpfulVotes.findFirst({
      where: and(
        eq(reviewHelpfulVotes.reviewId, id),
        eq(reviewHelpfulVotes.userId, userId)
      ),
    });

    return NextResponse.json({
      voted: !!vote,
    });
  } catch (error) {
    console.error('Error checking helpful vote:', error);
    return NextResponse.json({ voted: false });
  }
}
