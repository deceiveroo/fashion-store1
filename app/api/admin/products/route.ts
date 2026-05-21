import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { productListSelect } from '@/lib/product-query';
import { asc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';
import { canManageProducts } from '@/lib/admin-permissions';

async function requireProductManager() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 }) };
  }
  if (!canManageProducts(session.user.role)) {
    return { error: NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireProductManager();
    if ('error' in auth && auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

    const rows = await db
      .select({
        ...productListSelect,
        isActive: products.isActive,
      })
      .from(products)
      .orderBy(products.createdAt)
      .limit(limit);

    const ids = rows.map((p) => p.id).filter(Boolean);

    const images = ids.length
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            isMain: productImages.isMain,
            order: productImages.order,
          })
          .from(productImages)
          .where(inArray(productImages.productId, ids))
          .orderBy(asc(productImages.productId), asc(productImages.order))
      : [];

    const mainByProduct = new Map<string, string>();
    for (const img of images) {
      const pid = img.productId;
      if (!pid) continue;
      const current = mainByProduct.get(pid);
      if (current) continue;
      if (img.isMain) {
        mainByProduct.set(pid, img.url);
        continue;
      }
      const hasMainSomewhere = images.some((x) => x.productId === pid && x.isMain);
      if (!hasMainSomewhere) {
        mainByProduct.set(pid, img.url);
      }
    }

    return NextResponse.json(
      rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: parseFloat(String(p.price ?? '0')) || 0,
        inStock: Boolean(p.inStock),
        featured: Boolean(p.featured),
        isNew: Boolean(p.isNew),
        isActive: Boolean(p.isActive),
        createdAt: p.createdAt,
        mainImage: mainByProduct.get(p.id),
      })),
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[admin/products LIST]', error);
    return NextResponse.json({ error: 'Ошибка загрузки товаров' }, { status: 500 });
  }
}
