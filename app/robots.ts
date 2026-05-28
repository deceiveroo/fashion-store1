import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://e1evate.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Закрываем приватное и функциональное — не для индексации.
      disallow: [
        '/admin',
        '/api',
        '/checkout',
        '/orders',
        '/profile',
        '/favorites',
        '/maintenance',
        '/setup-required',
        '/test-theme',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
