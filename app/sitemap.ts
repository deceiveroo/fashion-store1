import type { MetadataRoute } from 'next';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://e1evate.vercel.app';

// Публичные индексируемые маршруты (без личного кабинета/оформления/поиска).
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/women', priority: 0.9, changeFrequency: 'daily' },
  { path: '/men', priority: 0.9, changeFrequency: 'daily' },
  { path: '/collections', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/new', priority: 0.8, changeFrequency: 'daily' },
  { path: '/gift-cards', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/gamification', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ id: products.id, updatedAt: products.updatedAt })
      .from(products)
      .where(sql`COALESCE(${products.isActive}, true) = true`)
      .limit(5000);

    productEntries = rows.map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (error) {
    // Sitemap не должен падать целиком из-за БД — отдаём хотя бы статику.
    console.error('[sitemap] failed to load products:', error);
  }

  return [...staticEntries, ...productEntries];
}
