import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { users } from './schema';
import type { NextAuthConfig } from 'next-auth';
import { jwtVerify } from 'jose';
import { checkAchievements, awardXP } from './gamification';
import { verifyTotp } from './totp';
import { isCurrentSessionActive } from './track-session';

// NextAuth v5 конфигурация
export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-authjs.session-token` : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'TOTP code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const email = String(credentials.email).toLowerCase().trim();
          const passwordPlain = String(credentials.password);
          const totpCode = credentials.totpCode ? String(credentials.totpCode).trim() : '';

          const [user] = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1);

          if (!user?.password) return null;

          const ok = await compare(passwordPlain, user.password);
          if (!ok) return null;

          // 2FA enforcement: if user has a stored secret, require a valid code.
          if (user.twoFactorSecret) {
            if (!totpCode) {
              throw new Error('TOTP_REQUIRED');
            }
            if (!verifyTotp(user.twoFactorSecret, totpCode)) {
              throw new Error('TOTP_INVALID');
            }
          }

          const role = String(user.role ?? 'customer').toLowerCase();
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? user.email,
            role,
            image: user.image ?? undefined,
          };
        } catch (error: any) {
          // Surface 2FA-specific errors so the UI can show a code prompt.
          if (error?.message === 'TOTP_REQUIRED' || error?.message === 'TOTP_INVALID') {
            throw error;
          }
          console.error('[AUTH] Error in authorize:', error);
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Обновляем last_sign_in при каждом входе
      if (user.id) {
        try {
          await db
            .update(users)
            .set({ lastSignIn: new Date() })
            .where(eq(users.id, user.id));
          
          // Gamification: Award XP for daily login and check achievements
          await awardXP(user.id, 5, 'Daily login');
          await checkAchievements(user.id, 'login');
        } catch (error) {
          console.error('Failed to update lastSignIn or gamification:', error);
          // Не блокируем вход если не удалось обновить
        }
      }

      if (account?.provider === 'google' && user.email) {
        const em = user.email.toLowerCase();
        const [u] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${em}`)
          .limit(1);
        // Если пользователь не найден, создаем его с ролью customer
        if (!u) {
          return true; // Позволяем создать нового пользователя
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.role = ((user as { role?: string }).role ?? 'customer') as string;
        token.image = (user as { image?: string | null }).image ?? undefined;
      }
      // Refresh role/image only on explicit update — avoids DB hit on every session poll
      const uid = (token.id as string) || token.sub;
      if (uid && trigger === 'update') {
        const [u] = await db
          .select({ role: users.role, image: users.image })
          .from(users)
          .where(eq(users.id, uid))
          .limit(1);
        if (u?.role) token.role = u.role as string;
        if (u?.image) token.image = u.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || token.sub || '';
        session.user.role = (token.role as string) ?? 'customer';
        session.user.image = (token.image as string) ?? undefined;
      }
      return session;
    },
  },
};

// NextAuth v5: экспортируем auth, signIn, signOut
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Для обратной совместимости
export const authOptions = authConfig;

// Кэш verifyAuth по cookie-токену. На странице профиля одновременно идёт
// 6+ API запросов; раньше каждый делал SELECT users — то есть 6 одинаковых
// запросов к БД. Теперь 1 запрос → остальные читают результат из памяти.
// TTL короткий (30 сек), чтобы при logout/role-change быстро инвалидировалось.
type CachedAuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
};
const authUserCache = new Map<string, { user: CachedAuthUser | null; until: number }>();
const AUTH_CACHE_TTL_MS = 30_000;

function getAuthCacheKey(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  // Берём именно session-token (а не весь Cookie-string), чтобы ключ
  // не менялся от не относящихся к авторизации кук.
  const match = cookieHeader.match(/(?:__Secure-)?(?:authjs|next-auth)\.session-token=([^;]+)/);
  if (match?.[1]) return `cookie:${match[1].slice(0, 64)}`;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return `bearer:${auth.slice(7, 71)}`;
  return null;
}

// Helper function to verify authentication from API routes
export async function verifyAuth(request: Request) {
  // 1. Быстрый путь — отдаём из кэша.
  const cacheKey = getAuthCacheKey(request);
  const now = Date.now();
  if (cacheKey) {
    const hit = authUserCache.get(cacheKey);
    if (hit && hit.until > now) {
      return hit.user;
    }
  }

  try {
    // Сначала пробуем получить пользователя из NextAuth session (cookies)
    const session = await auth();
    if (session?.user?.id) {
      // Получаем полные данные пользователя из базы
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (user) {
        // Проверка отзыва сессии (logout с другого устройства).
        // В dev пропускаем — нужно только в проде с реальными сессиями.
        if (process.env.NODE_ENV === 'production') {
          const active = await isCurrentSessionActive(user.id, request.headers);
          if (!active) {
            if (cacheKey) authUserCache.set(cacheKey, { user: null, until: now + AUTH_CACHE_TTL_MS });
            return null;
          }
        }

        const result: CachedAuthUser = {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role,
          image: user.image ?? undefined,
        };
        if (cacheKey) authUserCache.set(cacheKey, { user: result, until: now + AUTH_CACHE_TTL_MS });
        return result;
      }
    }

    // Если нет сессии, пробуем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      if (cacheKey) authUserCache.set(cacheKey, { user: null, until: now + AUTH_CACHE_TTL_MS });
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    const secretValue = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secretValue) return null;
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);

    // Support both custom auth token ("userId") and NextAuth-like token ("id"/"sub")
    const userId = (payload.userId as string) || (payload.id as string) || (payload.sub as string);
    if (!userId) {
      return null;
    }

    // Fetch user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      if (cacheKey) authUserCache.set(cacheKey, { user: null, until: now + AUTH_CACHE_TTL_MS });
      return null;
    }

    const result: CachedAuthUser = {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role,
      image: user.image ?? undefined,
    };
    if (cacheKey) authUserCache.set(cacheKey, { user: result, until: now + AUTH_CACHE_TTL_MS });
    return result;
  } catch (error) {
    console.error('[AUTH] verifyAuth error:', error);
    return null;
  }
}

// Сбросить кэш авторизации — вызывать при logout/смене роли/удалении сессии.
export function invalidateAuthCache(cookieToken?: string) {
  if (!cookieToken) {
    authUserCache.clear();
    return;
  }
  authUserCache.delete(`cookie:${cookieToken.slice(0, 64)}`);
}