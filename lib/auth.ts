import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { users } from './schema';
import type { NextAuthConfig } from 'next-auth';

// NextAuth v5 конфигурация
export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  pages: {
    signIn: '/admin/login',
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
          if (!['admin', 'manager', 'support'].includes(role)) {
            console.log('[AUTH] Role not in allowed list');
            return null;
          }
          
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
        const r = String(u?.role ?? '').toLowerCase();
        if (!u || !['admin', 'manager', 'support'].includes(r)) {
          return false; // v5: возвращаем false вместо redirect
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'customer';
        token.image = (user as any).image;
      }
      const uid = (token.id as string) || token.sub;
      if (uid && (!token.role || !token.image || trigger === 'update')) {
        const [u] = await db
          .select({ role: users.role, image: users.image })
          .from(users)
          .where(eq(users.id, uid))
          .limit(1);
        if (u?.role) token.role = u.role;
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