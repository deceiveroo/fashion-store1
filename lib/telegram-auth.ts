// lib/telegram-auth.ts
// Общая логика Telegram Login Widget: проверка подписи и апсерт пользователя.
// Используется и REST-эндпоинтом /api/auth/telegram, и NextAuth-провайдером 'telegram'
// (мост Telegram → реальная сессия). См. https://core.telegram.org/widgets/login#checking-authorization
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './schema';

export type TelegramAuthData = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

// Поля, которыми Telegram подписывает данные виджета (всё, что есть, кроме hash).
const TELEGRAM_FIELDS = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'] as const;

/** Собрать чистый объект только из telegram-полей (NextAuth может подмешать свои ключи). */
export function pickTelegramFields(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of [...TELEGRAM_FIELDS, 'hash']) {
    const v = raw[k];
    if (v !== undefined && v !== null && v !== '') out[k] = String(v);
  }
  return out;
}

/** Проверка HMAC-подписи Telegram по data-check-string. */
export function verifyTelegramAuth(data: Record<string, string>): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const { hash, ...rest } = data;
  if (!hash) return false;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(token).digest();
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

  // Сравнение в постоянном времени, чтобы не утекала информация через тайминг.
  const a = Buffer.from(hmac, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Данные виджета не старше 5 минут. */
export function isTelegramAuthFresh(authDate: string | number, maxAgeSec = 300): boolean {
  const ts = typeof authDate === 'string' ? parseInt(authDate, 10) : authDate;
  if (!Number.isFinite(ts)) return false;
  return Date.now() / 1000 - ts <= maxAgeSec;
}

export type TelegramUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
};

/** Найти/создать пользователя по telegram id. Стабильный email вида tg_{id}@telegram.user. */
export async function upsertTelegramUser(data: Record<string, string>): Promise<TelegramUser> {
  const telegramId = data.id;
  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const username = data.username || '';
  const photoUrl = data.photo_url || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || username || `User${telegramId}`;
  const telegramEmail = `tg_${telegramId}@telegram.user`;

  const existing = await db.select().from(users).where(eq(users.email, telegramEmail)).limit(1);

  if (existing.length === 0) {
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      email: telegramEmail,
      name,
      image: photoUrl || null,
      password: crypto.randomUUID(), // вход только через Telegram
      role: 'customer',
      status: 'active',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: userId, email: telegramEmail, name, image: photoUrl || undefined, role: 'customer' };
  }

  const u = existing[0];
  if (photoUrl && u.image !== photoUrl) {
    await db.update(users).set({ image: photoUrl, updatedAt: new Date() }).where(eq(users.id, u.id));
  }
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? name,
    image: (photoUrl || u.image) ?? undefined,
    role: String(u.role ?? 'customer').toLowerCase(),
  };
}
