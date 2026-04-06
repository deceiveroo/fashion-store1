// app/api/admin/products/[id]/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productCategory, categories } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getSession, isStaff } from '@/lib/server-auth';
import { canManageProducts } from '@/lib/admin-permissions';

async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      lastError = error;
      const err = error as { message?: string; code?: string };
      const isConnectionError =
        err.message?.includes('Connection terminated') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('Pool is draining and cannot accept new connections') ||
        err.code === 'ECONNRESET';
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Query failed (attempt ${i + 1}), retrying...`, err.message);
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// GET - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await params before accessing properties

    // Проверяем, является ли пользователь администратором
    const session = await getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Необходимо авторизоваться.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!(await isStaff())) {
      return new Response(
        JSON.stringify({ error: 'Доступ запрещен.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Получаем информацию о продукте (оптимизированный запрос)
    const productData = await queryWithRetry(() =>
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          inStock: products.inStock,
          featured: products.featured,
          createdAt: products.createdAt,
          mainImage: sql<string>`(SELECT url FROM ${productImages} WHERE ${productImages.productId} = ${products.id} AND ${productImages.isMain} = true LIMIT 1)`.as('mainImage'),
          categories: sql<string[]>`(SELECT COALESCE(array_agg(${categories.id}), ARRAY[]::text[]) FROM ${productCategory} LEFT JOIN ${categories} ON ${categories.id} = ${productCategory.categoryId} WHERE ${productCategory.productId} = ${products.id})`.as('categories'),
        })
        .from(products)
        .where(eq(products.id, id))
    );

    if (productData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Товар не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const product = productData[0];

    // Получаем все изображения продукта
    const productImagesData = await queryWithRetry(() =>
      db
        .select({ url: productImages.url, isMain: productImages.isMain, order: productImages.order })
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(productImages.order)
    );

    // Получаем все категории для продукта
    const productCategoryRecords = await queryWithRetry(() =>
      db
        .select({ categoryId: categories.id })
        .from(productCategory)
        .leftJoin(categories, eq(categories.id, productCategory.categoryId))
        .where(eq(productCategory.productId, id))
    );

    const categoryIds = productCategoryRecords.map(record => record.categoryId);

    return new Response(JSON.stringify({
      ...product,
      mainImage: product.mainImage || '/placeholder-image.jpg',
      images: productImagesData.map(img => img.url),
      categories: categoryIds,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при получении товара' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT - Update product by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await params before accessing properties
    const { name, description, price, categories: categoryIds, inStock, featured, images } = await request.json();

    // Проверяем, является ли пользователь администратором
    const session = await getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Необходимо авторизоваться.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!canManageProducts(session.user.role)) {
      return new Response(
        JSON.stringify({ error: 'Недостаточно прав для изменения товаров.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Валидация данных
    if (!name || !description || !price || !categoryIds || categoryIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Все обязательные поля должны быть заполнены, включая хотя бы одну категорию' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return new Response(
        JSON.stringify({ error: 'Цена должна быть положительным числом' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что товар существует
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (existingProduct.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Товар не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что все категории существуют
    const categoryRecords = await db.select().from(categories).where(inArray(categories.id, categoryIds));
    const existingCategoryIds = categoryRecords.map(cat => cat.id);
    
    const invalidCategories = categoryIds.filter((catId: string) => !existingCategoryIds.includes(catId));
    if (invalidCategories.length > 0) {
      return new Response(
        JSON.stringify({ error: `Следующие категории не существуют: ${invalidCategories.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Обновляем товар
    await db
      .update(products)
      .set({
        name: name || existingProduct[0].name,
        description: description || existingProduct[0].description,
        price: price !== undefined ? parseFloat(price) : existingProduct[0].price,
        inStock: inStock !== undefined ? Boolean(inStock) : existingProduct[0].inStock,
        featured: featured !== undefined ? Boolean(featured) : existingProduct[0].featured,
      })
      .where(eq(products.id, id));

    // Удаляем старые связи с категориями
    await db
      .delete(productCategory)
      .where(eq(productCategory.productId, id));

    // Создаем новые связи с категориями
    if (categoryIds && categoryIds.length > 0) {
      const categoryRecords = categoryIds.map((categoryId: string) => ({
        productId: id,
        categoryId
      }));
      await db.insert(productCategory).values(categoryRecords);
    }

    // Удаляем старые изображения
    await db
      .delete(productImages)
      .where(eq(productImages.productId, id));

    // Добавляем новые изображения
    if (images && images.length > 0) {
      const imageRecords = images.map((url: string, index: number) => ({
        id: `${id}-img-${index}`, // Генерируем уникальный ID
        productId: id,
        url,
        isMain: index === 0, // Первое изображение - главное
        order: index,
      }));
      await db.insert(productImages).values(imageRecords);
    }

    return new Response(
      JSON.stringify({ message: 'Товар успешно обновлен' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при обновлении товара' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE - Delete product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await params before accessing properties

    // Проверяем, является ли пользователь администратором
    const session = await getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Необходимо авторизоваться.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!canManageProducts(session.user.role)) {
      return new Response(
        JSON.stringify({ error: 'Недостаточно прав для удаления товаров.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что товар существует
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (existingProduct.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Товар не найден' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Удаляем связи с категориями
    await db
      .delete(productCategory)
      .where(eq(productCategory.productId, id));

    // Удаляем изображения продукта
    await db
      .delete(productImages)
      .where(eq(productImages.productId, id));

    // Удаляем продукт
    await db
      .delete(products)
      .where(eq(products.id, id));

    return new Response(
      JSON.stringify({ message: 'Товар успешно удален' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    return new Response(
      JSON.stringify({ error: 'Ошибка сервера при удалении товара' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}