import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, orderNumber, message } = await request.json();

    if (!orderId || !message) {
      return NextResponse.json(
        { error: 'orderId and message are required' },
        { status: 400 }
      );
    }

    // Генерируем уникальный ID сессии
    const sessionId = `order_${orderId}_${Date.now()}`;
    const chatId = crypto.randomUUID();

    // Создаём сессию чата с привязкой к заказу
    const { error: sessionError } = await supabaseAdmin
      .from('support_chat_sessions')
      .insert({
        id: chatId,
        session_id: sessionId,
        user_id: session.user.id,
        status: 'active',
        ai_disabled: false,
        message_count: 0,
        metadata: JSON.stringify({
          orderId,
          orderNumber,
          type: 'order_support'
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (sessionError) {
      console.error('Error creating chat session:', sessionError);
      return NextResponse.json(
        { 
          error: 'Failed to create chat session',
          details: sessionError.message,
          code: sessionError.code
        },
        { status: 500 }
      );
    }

    // Сохраняем первое сообщение
    const messageId = crypto.randomUUID();
    const { error: messageError } = await supabaseAdmin
      .from('support_chat_messages')
      .insert({
        id: messageId,
        session_id: sessionId,
        message: `[ЗАКАЗ #${orderNumber || orderId.slice(0, 8).toUpperCase()}]\n\n${message}`,
        sender: 'user',
        image_url: null,
        created_at: new Date().toISOString(),
        read_by_admin: false,
      });

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { 
          error: 'Failed to create message',
          details: messageError.message,
          code: messageError.code
        },
        { status: 500 }
      );
    }

    // Отправляем Telegram уведомление админу
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${appUrl}/api/telegram/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🚨 СРОЧНО: Новый запрос по заказу',
          message: `Пользователь обратился по заказу #${orderNumber || orderId.slice(0, 8).toUpperCase()}\n\n"${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
          priority: 'high',
          chatLink: `${appUrl}/admin/support-chats/${chatId}`,
        }),
      });
    } catch (notifyError) {
      console.error('Failed to send Telegram notification:', notifyError);
      // Не блокируем основной поток если уведомление не отправилось
    }

    return NextResponse.json({
      success: true,
      sessionId,
      chatId,
    });
  } catch (error: any) {
    console.error('[ORDER SUPPORT] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create support chat',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
