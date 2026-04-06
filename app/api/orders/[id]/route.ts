// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSession, isAdmin } from '@/lib/server-auth';

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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Получаем заказ с элементами
    const orderData = await queryWithRetry(() =>
      db
        .select({
          id: orders.id,
          userId: orders.userId,
          total: orders.total,
          discount: orders.discount,
          deliveryPrice: orders.deliveryPrice,
          deliveryMethod: orders.deliveryMethod,
          paymentMethod: orders.paymentMethod,
          status: orders.status,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          recipient: orders.recipient,
          comment: orders.comment,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1)
    );

    if (orderData.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderData[0];
    
    // Проверяем, что пользователь имеет доступ к этому заказу
    if (session.user.id !== order.userId && !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получаем элементы заказа
    const items = await queryWithRetry(() =>
      db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
    );

    const fullOrder = {
      id: order.id,
      userId: order.userId,
      total: Number(order.total),
      discount: Number(order.discount || 0),
      deliveryPrice: Number(order.deliveryPrice || 0),
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      status: order.status as 'processing' | 'shipped' | 'delivered' | 'cancelled',
      createdAt: order.createdAt?.toString() || new Date().toISOString(),
      updatedAt: order.updatedAt?.toString() || new Date().toISOString(),
      recipient: typeof order.recipient === 'string' 
        ? JSON.parse(order.recipient) 
        : order.recipient,
      comment: order.comment,
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        image: item.image,
        size: item.size || '',
        color: item.color || ''
      }))
    };

    return NextResponse.json(fullOrder);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Обновление статуса заказа (для владельца заказа)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  try {
    const { status } = await request.json();
    const orderId = (await params).id;

    // Получаем заказ, чтобы проверить, принадлежит ли он пользователю
    const order = await queryWithRetry(() =>
      db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, session.user.id)))
        .limit(1)
    );

    if (order.length === 0) {
      return NextResponse.json(
        { message: 'Заказ не найден или нет доступа' },
        { status: 404 }
      );
    }

    // Обновляем статус заказа
    const [updatedOrder] = await queryWithRetry(() =>
      db
        .update(orders)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning()
    );

    const fullOrder = {
      id: updatedOrder.id,
      items: [],
      total: Number(updatedOrder.total),
      discount: Number(updatedOrder.discount || 0),
      deliveryPrice: Number(updatedOrder.deliveryPrice || 0),
      deliveryMethod: updatedOrder.deliveryMethod,
      paymentMethod: updatedOrder.paymentMethod,
      status: updatedOrder.status as 'processing' | 'shipped' | 'delivered' | 'cancelled',
      createdAt: updatedOrder.createdAt?.toString() || new Date().toISOString(),
      recipient: typeof updatedOrder.recipient === 'string' 
        ? JSON.parse(updatedOrder.recipient) 
        : updatedOrder.recipient,
      comment: updatedOrder.comment
    };

    return NextResponse.json(fullOrder);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { message: 'Ошибка при обновлении заказа' },
      { status: 500 }
    );
  }
}

// PUT - Обновление статуса заказа (для админа)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  // Проверяем роль админа
  if (!(await isAdmin())) {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { status } = await request.json();
    const orderId = (await params).id;

    if (!status) {
      return NextResponse.json({ message: 'Статус обязателен' }, { status: 400 });
    }

    await queryWithRetry(() =>
      db
        .update(orders)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
    );

    return NextResponse.json({ message: 'Статус обновлен', orderId });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { message: 'Ошибка при обновлении заказа' },
      { status: 500 }
    );
  }
}

// DELETE - Удаление заказа (для админа)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }

  // Проверяем роль админа
  if (!(await isAdmin())) {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const orderId = (await params).id;

    await queryWithRetry(() =>
      db.delete(orders).where(eq(orders.id, orderId))
    );

    return NextResponse.json({ message: 'Заказ удален', orderId });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { message: 'Ошибка при удалении заказа' },
      { status: 500 }
    );
  }
}