import { db } from './db';
import { products, users, categories, productCategory, productImages } from './db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

export async function seedDatabase() {
  // Seed categories first
  const existingCategories = await db.select().from(categories).limit(1);

  if (existingCategories.length === 0) {
    await db.insert(categories).values([
      { id: 'men', name: 'Мужское', slug: 'muzhskoe' },
      { id: 'women', name: 'Женское', slug: 'zhenskoe' },
      { id: 'shoes', name: 'Обувь', slug: 'obuv', parentId: 'men' },
      { id: 'outerwear', name: 'Верхняя одежда', slug: 'verhnyaya-odezhda', parentId: 'men' },
      { id: 'new', name: 'Новинки', slug: 'novinki' },
      { id: 'collections', name: 'Коллекции', slug: 'kollektsii' },
    ]);
    console.log('Категории созданы');
  }

  // Always seed admin user if not exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(users).values([
      {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin',
        role: 'admin',
      },
    ]);
    console.log('Админ пользователь создан');
  } else {
    console.log('Админ пользователь уже существует');
    // Ensure admin role is set
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, 'admin@example.com'));
    console.log('Роль администратора обновлена');
  }

  // Seed regular user if not exists
  const existingUser = await db.select().from(users).where(eq(users.email, 'user@example.com')).limit(1);

  if (existingUser.length === 0) {
    await db.insert(users).values([
      {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        password: 'user123',
        role: 'user',
      },
    ]);
    console.log('Обычный пользователь создан');
  }

  const existingProducts = await db.select().from(products).limit(1);

  if (existingProducts.length > 0) {
    console.log('Продукты уже существуют');
    return;
  }

  // Create 10 products for testing (reduced from 180 to avoid connection issues)
  const productsData = [];
  const imagesData = [];
  const productCategoriesData = [];
  
  // Generate products
  for (let i = 1; i <= 10; i++) {
    const productId = `prod-${i}`;
    const gender = i <= 5 ? 'male' : 'female';
    const is_new = i <= 3 ? 1 : 0;
    
    // Generate product name based on gender
    let name = '';
    if (gender === 'male') {
      name = `Мужской товар ${i}`;
    } else if (gender === 'female') {
      name = `Женский товар ${i}`;
    } else {
      name = `Унисекс товар ${i}`;
    }
    
    productsData.push({
      id: productId,
      name: name,
      description: `Описание для ${name} - качественный товар для повседневного использования`,
      price: Math.floor(Math.random() * 10000) + 1000, // Random price between 1000-11000
      inStock: true,
      featured: i <= 20 ? true : false,
      meta: JSON.stringify({
        tags: ['одежда', gender, is_new ? 'новинка' : 'классика'],
        colors: ['черный', 'белый', 'синий', 'красный'],
        sizes: ['S', 'M', 'L', 'XL'],
        gender: gender
      })
    });
    
    // Add product images
    imagesData.push({
      id: `img-${productId}`,
      productId: productId,
      url: `https://placehold.co/400x400/3b82f6/white?text=Product+${i}`,
      isMain: true,
      order: 0
    });
    
    // Assign categories based on gender
    let categoryId = '';
    if (gender === 'male') {
      categoryId = 'men';
    } else if (gender === 'female') {
      categoryId = 'women';
    } else {
      categoryId = 'collections';
    }
    
    productCategoriesData.push({
      productId: productId,
      categoryId: categoryId
    });
    
    // Add some products to 'new' category
    if (is_new) {
      productCategoriesData.push({
        productId: productId,
        categoryId: 'new'
      });
    }
  }

  // Insert products one by one to avoid connection issues with Supabase
  if (productsData.length > 0) {
    for (let i = 0; i < productsData.length; i++) {
      await db.insert(products).values(productsData[i]);
      if ((i + 1) % 20 === 0) {
        console.log(`Продукты созданы: ${i + 1}/${productsData.length}`);
      }
    }
    console.log(`Все продукты созданы: ${productsData.length}/${productsData.length}`);
  }

  // Insert images one by one
  if (imagesData.length > 0) {
    for (let i = 0; i < imagesData.length; i++) {
      await db.insert(productImages).values(imagesData[i]);
    }
    console.log('Изображения созданы');
  }

  // Insert product categories one by one
  if (productCategoriesData.length > 0) {
    for (let i = 0; i < productCategoriesData.length; i++) {
      await db.insert(productCategory).values(productCategoriesData[i]);
    }
    console.log('Связи продукт-категория созданы');
  }
  
  console.log(`Создано ${productsData.length} товаров`);
}

async function main() {
  try {
    await seedDatabase();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();