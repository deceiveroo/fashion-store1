import { sql } from 'drizzle-orm';
import { products } from './schema';

/** Derived from `stock` — works even before `in_stock` column is added (run migrations/sync-live-db-to-baza.sql). */
export const productInStock = sql<boolean>`(${products.stock} > 0)`.as('in_stock');

/** Featured flag from `featured` column (see migrations/sync-live-db-to-baza.sql for is_featured). */
export const productFeatured = sql<boolean>`COALESCE(${products.featured}, false)`.as('featured');

export const productListSelect = {
  id: products.id,
  name: products.name,
  description: products.description,
  price: products.price,
  inStock: productInStock,
  featured: productFeatured,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
} as const;
