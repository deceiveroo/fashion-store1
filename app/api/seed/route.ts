// app/api/seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, products, productImages, categories, productCategory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Проверяем, существуют ли уже какие-то данные
    const existingCategories = await db.select().from(categories).limit(1);

    if (existingCategories.length === 0) {
      // Создаем категории
      await db.insert(categories).values([
        { id: 'men', name: 'Мужское', slug: 'men' },
        { id: 'women', name: 'Женское', slug: 'women' },
        { id: 'new', name: 'Новинки', slug: 'new' },
        { id: 'featured', name: 'Рекомендуемое', slug: 'featured' },
      ]);
    }

    // Проверяем, существуют ли пользователи
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      // Создаем пользователей
      await db.insert(users).values([
        {
          id: 'user-1',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
        },
        {
          id: 'user-2',
          name: 'Regular User',
          email: 'user@example.com',
          password: 'user123',
          role: 'user',
        }
      ]);
    }

    // Проверяем, существуют ли продукты
    const existingProducts = await db.select().from(products).limit(1);

    if (existingProducts.length === 0) {
      // Создаем продукты
      const productsData = [
        {
          id: '1',
          name: 'Квантовая Куртка',
          description: 'Революционная куртка с адаптивным контролем температуры и технологией умной ткани',
          price: 399.99,
          inStock: true,
          featured: true,
        },
        {
          id: '2',
          name: 'Нео-Тех Брюки',
          description: 'Умные брюки с интегрированным гибким дисплеем и управлением жестами',
          price: 289.99,
          inStock: true,
          featured: true,
        },
        {
          id: '3',
          name: 'Голографические Кроссовки',
          description: 'Лимитированные кроссовки с динамическими голографическими панелями',
          price: 459.99,
          inStock: true,
          featured: true,
        },
      ];

      await db.insert(products).values(productsData);

      // Создаем изображения
      const imagesData = [
        { id: '1-img-1', productId: '1', url: 'https://placehold.co/400x400/3b82f6/white?text=Quantum+Jacket', isMain: true, order: 0 },
        { id: '2-img-1', productId: '2', url: 'https://placehold.co/400x400/ef4444/white?text=Neo-Tech+Pants', isMain: true, order: 0 },
        { id: '3-img-1', productId: '3', url: 'https://placehold.co/400x400/10b981/white?text=Holo+Sneakers', isMain: true, order: 0 },
      ];

      await db.insert(productImages).values(imagesData);

      // Создаем связи продукт-категория
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

    return new Response(
      JSON.stringify({ message: 'База данных успешно засеяна' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка сервера при засеивании базы данных:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при засеивании базы данных' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
