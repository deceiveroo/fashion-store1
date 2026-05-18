import { db, safeQuery } from '@/lib/db';
import { products, productCategory, productImages, categories } from '@/lib/schema';
import { productInStock, productFeatured } from '@/lib/product-query';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  category?: string;
  images: { id: string; url: string; isMain: boolean }[];
  mainImage: string;
};

export type CatalogOptions = {
  categorySlugs?: string[];
  categoryIds?: string[];
  featuredOnly?: boolean;
  newOnly?: boolean;
  limit?: number;
  fallbackToAll?: boolean;
};

/** Matches live Supabase schema (no deleted_at on products). */
const activeProducts = sql`COALESCE(${products.isActive}, true) = true`;

const productSelect = {
  id: products.id,
  name: products.name,
  description: products.description,
  price: products.price,
  inStock: productInStock,
  featured: productFeatured,
  isNew: products.isNew,
};

async function resolveCategoryIds(slugs: string[], ids: string[]): Promise<string[]> {
  const resolved = new Set<string>(ids.filter(Boolean));

  const slugList = slugs.filter(Boolean);
  if (slugList.length > 0) {
    const rows = await safeQuery(() =>
      db
        .select({ id: categories.id })
        .from(categories)
        .where(or(inArray(categories.slug, slugList), inArray(categories.id, slugList)))
    );
    rows?.forEach((r) => resolved.add(r.id));
  }

  return [...resolved];
}

async function fetchProductIdsForCategories(categoryIds: string[]): Promise<string[]> {
  if (categoryIds.length === 0) return [];

  const ids = new Set<string>();

  const fromJunction = await safeQuery(() =>
    db
      .select({ productId: productCategory.productId })
      .from(productCategory)
      .where(inArray(productCategory.categoryId, categoryIds))
  );
  fromJunction?.forEach((r) => ids.add(r.productId));

  const fromDirect = await safeQuery(() =>
    db
      .select({ id: products.id })
      .from(products)
      .where(and(inArray(products.categoryId, categoryIds), activeProducts))
  );
  fromDirect?.forEach((r) => ids.add(r.id));

  return [...ids];
}

async function attachImages(
  rows: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string;
    inStock: boolean;
    featured: boolean;
    isNew: boolean | null;
  }>
): Promise<CatalogProduct[]> {
  if (rows.length === 0) return [];

  const productIds = rows.map((p) => p.id);
  const images = await safeQuery(() =>
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(productImages.order)
  );

  const imagesByProduct = (images ?? []).reduce(
    (acc, img) => {
      if (!acc[img.productId]) acc[img.productId] = [];
      acc[img.productId].push(img);
      return acc;
    },
    {} as Record<string, (typeof productImages.$inferSelect)[]>
  );

  return rows.map((product) => {
    const list = imagesByProduct[product.id] ?? [];
    const formatted = list.map((img) => ({
      id: img.id,
      url: img.url,
      isMain: img.isMain ?? false,
    }));
    const priceNum = parseFloat(String(product.price ?? '0'));

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      categories: [] as string[],
      price: Number.isFinite(priceNum) ? priceNum : 0,
      inStock: product.inStock ?? true,
      featured: product.featured ?? false,
      isNew: product.isNew ?? false,
      images: formatted,
      mainImage:
        formatted.find((img) => img.isMain)?.url ||
        formatted[0]?.url ||
        '/placeholder-image.jpg',
    };
  });
}

async function fetchProductsByIds(
  productIds: string[],
  limit: number,
  opts?: { featuredOnly?: boolean; newOnly?: boolean }
) {
  if (productIds.length === 0) return [];

  const conditions = [inArray(products.id, productIds), activeProducts];
  if (opts?.featuredOnly) conditions.push(eq(products.featured, true));
  if (opts?.newOnly) conditions.push(eq(products.isNew, true));

  const result = await safeQuery(() =>
    db
      .select(productSelect)
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
  );

  return result ?? [];
}

async function fetchAllActiveProducts(limit: number) {
  const result = await safeQuery(() =>
    db
      .select(productSelect)
      .from(products)
      .where(activeProducts)
      .orderBy(desc(products.createdAt))
      .limit(limit)
  );
  return result ?? [];
}

export async function getCatalogProducts(options: CatalogOptions = {}): Promise<CatalogProduct[]> {
  const {
    categorySlugs = [],
    categoryIds = [],
    featuredOnly = false,
    newOnly = false,
    limit = 48,
    fallbackToAll = true,
  } = options;

  try {
    const resolvedCategoryIds = await resolveCategoryIds(categorySlugs, categoryIds);
    const productIds = await fetchProductIdsForCategories(resolvedCategoryIds);

    let rows =
      productIds.length > 0
        ? await fetchProductsByIds(productIds, limit, { featuredOnly, newOnly })
        : [];

    if (rows.length === 0 && fallbackToAll) {
      rows = await fetchAllActiveProducts(limit);
    }

    const unique = rows.filter(
      (product, index, self) => index === self.findIndex((p) => p.id === product.id)
    );

    return attachImages(unique);
  } catch (error) {
    console.error('[catalog-products]', error);
    try {
      const rows = await fetchAllActiveProducts(limit);
      return attachImages(rows);
    } catch {
      return [];
    }
  }
}
