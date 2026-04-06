const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function createTestData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool);

  try {
    // Create some test categories
    console.log('Creating test categories...');
    
    const categoryId1 = uuidv4();
    const categoryId2 = uuidv4();
    
    await db.insert(db._.schema.categories).values([
      {
        id: categoryId1,
        name: 'Платья',
        slug: 'dresses',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: categoryId2,
        name: 'Футболки',
        slug: 't-shirts',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    console.log('Categories created:', categoryId1, categoryId2);

    // Create a test product
    console.log('Creating test product...');
    
    const productId = uuidv4();
    const priceInCents = 299900; // 2999.00 rubles in cents
    
    await db.insert(db._.schema.products).values({
      id: productId,
      name: 'Летнее платье',
      description: 'Красивое летнее платье из хлопка',
      price: priceInCents,
      inStock: true,
      featured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Product created:', productId);

    // Add product to category
    await db.insert(db._.schema.productCategory).values({
      id: uuidv4(),
      productId: productId,
      categoryId: categoryId1,
      createdAt: new Date(),
    });

    console.log('Product-category link created');

    // Add product image
    await db.insert(db._.schema.productImages).values({
      id: uuidv4(),
      productId: productId,
      url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
      isMain: true,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Product image added');
    console.log('Test data created successfully!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await pool.end();
  }
}

createTestData();
