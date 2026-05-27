// @ts-nocheck — seed data shape may diverge from current `products` schema (slug/sku optional fields).
// app/api/seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, products, productImages, categories, productCategory } from '@/lib/db/schema';
import { isAdmin } from '@/lib/server-auth';

const SEED_ALLOWED = process.env.ALLOW_SEED === 'true';

async function runSeed() {
  const existingCategories = await db.select().from(categories).limit(1);
  if (existingCategories.length === 0) {
    await db.insert(categories).values([
      { id: 'men', name: 'Мужское', slug: 'men' },
      { id: 'women', name: 'Женское', slug: 'women' },
      { id: 'new', name: 'Новинки', slug: 'new' },
      { id: 'featured', name: 'Рекомендуемое', slug: 'featured' },
    ]);
  }

  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
    const adminPwd = process.env.SEED_ADMIN_PASSWORD;
    const userPwd = process.env.SEED_USER_PASSWORD;
    if (!adminPwd || !userPwd) {
      throw new Error('SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD env vars are required');
    }
    const adminHash = await bcrypt.hash(adminPwd, 10);
    const userHash = await bcrypt.hash(userPwd, 10);

    await db.insert(users).values([
      {
        id: 'user-1',
        name: 'Admin User',
        email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
        password: adminHash,
        role: 'admin',
      },
      {
        id: 'user-2',
        name: 'Regular User',
        email: process.env.SEED_USER_EMAIL || 'user@example.com',
        password: userHash,
        role: 'customer',
      },
    ]);
  }

  const existingProducts = await db.select().from(products).limit(1);
  if (existingProducts.length === 0) {
    const productsData = [
      {
        id: '1',
        name: 'Квантовая Куртка',
        description: 'Революционная куртка с адаптивным контролем температуры и технологией умной ткани',
        price: '399.99',
        inStock: true,
        featured: true,
      },
      {
        id: '2',
        name: 'Нео-Тех Брюки',
        description: 'Умные брюки с интегрированным гибким дисплеем и управлением жестами',
        price: '289.99',
        inStock: true,
        featured: true,
      },
      {
        id: '3',
        name: 'Голографические Кроссовки',
        description: 'Лимитированные кроссовки с динамическими голографическими панелями',
        price: '459.99',
        inStock: true,
        featured: true,
      },
    ];
    await db.insert(products).values(productsData);

    const imagesData = [
      { id: '1-img-1', productId: '1', url: 'https://placehold.co/400x400/3b82f6/white?text=Quantum+Jacket', isMain: true, order: 0 },
      { id: '2-img-1', productId: '2', url: 'https://placehold.co/400x400/ef4444/white?text=Neo-Tech+Pants', isMain: true, order: 0 },
      { id: '3-img-1', productId: '3', url: 'https://placehold.co/400x400/10b981/white?text=Holo+Sneakers', isMain: true, order: 0 },
    ];
    await db.insert(productImages).values(imagesData);

    const productCategoriesData = [
      { productId: '1', categoryId: 'men' },
      { productId: '1', categoryId: 'featured' },
      { productId: '2', categoryId: 'men' },
      { productId: '2', categoryId: 'new' },
      { productId: '3', categoryId: 'women' },
      { productId: '3', categoryId: 'featured' },
    ];
    await db.insert(productCategory).values(productCategoriesData);
  }
}

export async function POST(request: NextRequest) {
  if (!SEED_ALLOWED) {
    return NextResponse.json({ error: 'Seeding disabled. Set ALLOW_SEED=true to enable.' }, { status: 403 });
  }
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await runSeed();
    return NextResponse.json({ message: 'База данных успешно засеяна' });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error?.message || 'Ошибка сервера при засеивании базы данных' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use POST with admin auth and ALLOW_SEED=true' }, { status: 405 });
}
