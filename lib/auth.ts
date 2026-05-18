import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { users } from './schema';
import type { NextAuthConfig } from 'next-auth';
import { jwtVerify } from 'jose';

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
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] authorize called');
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }
          const email = String(credentials.email).toLowerCase().trim();
          const passwordPlain = String(credentials.password);
          console.log('[AUTH] Email:', email);
          
          const [user] = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1);
          
          console.log('[AUTH] User found:', !!user, user ? `id=${user.id}` : 'null');
          if (!user?.password) {
            console.log('[AUTH] No password in user object');
            return null;
          }
          
          console.log('[AUTH] Comparing password...');
          const ok = await compare(passwordPlain, user.password);
          console.log('[AUTH] Password match:', ok);
          if (!ok) {
            console.log('[AUTH] Password mismatch, returning null');
            return null;
          }
          
          const role = String(user.role ?? 'customer').toLowerCase();
          console.log('[AUTH] Role:', role);
          // Разрешаем вход всем ролям
          console.log('[AUTH] Success! Returning user object');
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? user.email,
            role,
            image: user.image ?? undefined,
          };
        } catch (error) {
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
        token.id = user.id;
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

// Helper function to verify authentication from API routes
export async function verifyAuth(request: Request) {
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
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role,
          image: user.image ?? undefined,
        };
      }
    }

    // Если нет сессии, пробуем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    const secretValue = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
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
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role,
      image: user.image ?? undefined,
    };
  } catch (error) {
    console.error('[AUTH] verifyAuth error:', error);
    return null;
  }
}