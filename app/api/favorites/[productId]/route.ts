import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userWishlistItems } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Пользователь не аутентифицирован' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const awaitedParams = await params;
    const { productId } = awaitedParams;

    const existingFavorite = await db
      .select({ id: userWishlistItems.id })
      .from(userWishlistItems)
      .where(and(eq(userWishlistItems.userId, session.user.id), eq(userWishlistItems.productId, productId)))
      .limit(1);

    if (existingFavorite.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Избранное не найдено' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db
      .delete(userWishlistItems)
      .where(and(eq(userWishlistItems.userId, session.user.id), eq(userWishlistItems.productId, productId)));

    return new Response(
      JSON.stringify({ message: 'Избранное удалено' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка при удалении из избранного:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при удалении из избранного' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}