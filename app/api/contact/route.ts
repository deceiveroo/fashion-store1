import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactMessages } from '@/lib/schema';
import { z } from 'zod';

const ContactSchema = z.object({
  firstName: z.string().trim().max(120).optional().or(z.literal('')),
  lastName: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().email('Некорректный email').max(255),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Сообщение слишком короткое').max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Проверьте поля формы', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || null;
    const userAgent = request.headers.get('user-agent') || null;

    const data = parsed.data;
    await db.insert(contactMessages).values({
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email.toLowerCase(),
      subject: data.subject || null,
      message: data.message,
      ip,
      userAgent,
    });

    return NextResponse.json({ ok: true, message: 'Сообщение отправлено' });
  } catch (error) {
    console.error('[contact] Failed to save message:', error);
    return NextResponse.json({ error: 'Не удалось сохранить сообщение' }, { status: 500 });
  }
}
