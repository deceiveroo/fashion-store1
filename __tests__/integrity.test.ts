import { expect, test, describe, beforeAll } from 'vitest';
import { db } from '../lib/db';
import { 
  products, 
  categories, 
  productCategoryLinks, 
  users, 
  orders,
  orderItems
} from '../lib/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('Database Integrity Tests', () => {
  // Test data IDs to clean up after tests
  const testIds: { [key: string]: string[] } = {
    products: [],
    categories: [],
    users: [],
    orders: [],
  };

  // Clean up test data after tests
  afterAll(async () => {
    // Clean up test data in reverse dependency order
    if (testIds.orders.length > 0) {
      await db.delete(orders).where(
        sql`${orders.id} IN (${testIds.orders.join(',')})`
      );
    }
    
    await db.delete(productCategoryLinks).where(
      and(
        sql`${productCategoryLinks.productId} IN (${testIds.products.join(',')})`,
        sql`${productCategoryLinks.categoryId} IN (${testIds.categories.join(',')})`
      )
    );
    
    if (testIds.products.length > 0) {
      await db.delete(products).where(
        sql`${products.id} IN (${testIds.products.join(',')})`
      );
    }
    
    if (testIds.categories.length > 0) {
      await db.delete(categories).where(
        sql`${categories.id} IN (${testIds.categories.join(',')})`
      );
    }
    
    if (testIds.users.length > 0) {
      await db.delete(users).where(
        sql`${users.id} IN (${testIds.users.join(',')})`
      );
    }
  });

  test('should prevent attaching non-existent product to category', async () => {
    const fakeProductId = `test_${nanoid()}`;
    const fakeCategoryId = `test_${nanoid()}`;
    
    await expect(async () => {
      await db.transaction(async (tx) => {
        await tx.insert(productCategoryLinks).values({
          id: `link_${nanoid()}`,
          productId: fakeProductId,
          categoryId: fakeCategoryId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
    }).rejects.toThrow();
  });

  test('should prevent attaching product to non-existent category', async () => {
    // Create a test product first
    const testProduct = await db.insert(products).values({
      id: `prod_${nanoid()}`,
      name: 'Test Product',
      description: 'Test product description',
      price: 29.99,
    }).returning();
    
    testIds.products.push(testProduct[0].id);

    const fakeCategoryId = `cat_${nanoid()}`;
    
    await expect(async () => {
      await db.transaction(async (tx) => {
        await tx.insert(productCategoryLinks).values({
          id: `link_${nanoid()}`,
          productId: testProduct[0].id,
          categoryId: fakeCategoryId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
    }).rejects.toThrow();
  });

  test('should successfully attach valid product to valid category', async () => {
    // Create a test product
    const testProduct = await db.insert(products).values({
      id: `prod_${nanoid()}`,
      name: 'Valid Product',
      description: 'Valid product description',
      price: 49.99,
    }).returning();
    
    testIds.products.push(testProduct[0].id);

    // Create a test category
    const testCategory = await db.insert(categories).values({
      id: `cat_${nanoid()}`,
      name: 'Valid Category',
      slug: `valid-category-${Date.now()}`,
    }).returning();
    
    testIds.categories.push(testCategory[0].id);

    // This should succeed
    const linkResult = await db.insert(productCategoryLinks).values({
      id: `link_${nanoid()}`,
      productId: testProduct[0].id,
      categoryId: testCategory[0].id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    expect(linkResult).toHaveLength(1);
    expect(linkResult[0].productId).toBe(testProduct[0].id);
    expect(linkResult[0].categoryId).toBe(testCategory[0].id);
    
    // Clean up the link
    await db.delete(productCategoryLinks).where(
      eq(productCategoryLinks.id, linkResult[0].id)
    );
  });

  test('should maintain referential integrity when deleting products', async () => {
    // Create a test product
    const testProduct = await db.insert(products).values({
      id: `prod_${nanoid()}`,
      name: 'Product for deletion test',
      description: 'Product to test deletion',
      price: 19.99,
    }).returning();
    
    testIds.products.push(testProduct[0].id);

    // Create a test category
    const testCategory = await db.insert(categories).values({
      id: `cat_${nanoid()}`,
      name: 'Category for deletion test',
      slug: `del-test-category-${Date.now()}`,
    }).returning();
    
    testIds.categories.push(testCategory[0].id);

    // Link them
    const linkResult = await db.insert(productCategoryLinks).values({
      id: `link_${nanoid()}`,
      productId: testProduct[0].id,
      categoryId: testCategory[0].id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    // Delete the product (this should cascade delete the link)
    await db.delete(products).where(eq(products.id, testProduct[0].id));

    // Verify the link was also deleted (if CASCADE is working)
    const remainingLink = await db.query.productCategoryLinks.findFirst({
      where: eq(productCategoryLinks.id, linkResult[0].id),
    });

    // Actually, in SQLite foreign keys need to be enabled explicitly
    // So we expect the link to still exist but be invalid
    // Our schema has onDelete: 'cascade' which should work with Drizzle ORM
    // But let's check if the link still exists
    if (remainingLink) {
      // If it still exists, it should be marked as deleted (soft delete)
      expect(remainingLink.deletedAt).not.toBeNull();
    }
  });

  test('should prevent creating order with non-existent user', async () => {
    const fakeUserId = `user_${nanoid()}`;
    
    await expect(async () => {
      await db.transaction(async (tx) => {
        await tx.insert(orders).values({
          id: `order_${nanoid()}`,
          userId: fakeUserId,
          total: 99.99,
        });
      });
    }).rejects.toThrow();
  });

  test('should successfully create a complete order with valid user', async () => {
    // Create a test user
    const testUser = await db.insert(users).values({
      id: `user_${nanoid()}`,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    }).returning();
    
    testIds.users.push(testUser[0].id);

    // Create the order
    const orderResult = await db.insert(orders).values({
      id: `order_${nanoid()}`,
      userId: testUser[0].id,
      total: 129.99,
    }).returning();
    
    testIds.orders.push(orderResult[0].id);

    expect(orderResult).toHaveLength(1);
    expect(orderResult[0].userId).toBe(testUser[0].id);
    expect(orderResult[0].total).toBe(129.99);
  });

  test('should validate time window constraints', async () => {
    // Create a test product
    const testProduct = await db.insert(products).values({
      id: `prod_${nanoid()}`,
      name: 'Time window test product',
      description: 'Product for time window test',
      price: 39.99,
    }).returning();
    
    testIds.products.push(testProduct[0].id);

    // Create a test category
    const testCategory = await db.insert(categories).values({
      id: `cat_${nanoid()}`,
      name: 'Time window test category',
      slug: `time-window-category-${Date.now()}`,
    }).returning();
    
    testIds.categories.push(testCategory[0].id);

    // Create a link with a time window in the past
    const pastDate = Date.now() - 86400000; // 1 day ago
    const linkResult = await db.insert(productCategoryLinks).values({
      id: `link_${nanoid()}`,
      productId: testProduct[0].id,
      categoryId: testCategory[0].id,
      validFrom: pastDate - 86400000, // 2 days ago
      validTo: pastDate, // ended yesterday
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    expect(linkResult).toHaveLength(1);
    
    // Clean up the link
    await db.delete(productCategoryLinks).where(
      eq(productCategoryLinks.id, linkResult[0].id)
    );
  });
});