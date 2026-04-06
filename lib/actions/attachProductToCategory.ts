'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull, lte, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  productCategoryLinks, 
  products, 
  categories, 
  linkEvents 
} from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export interface AttachProductToCategoryParams {
  productId?: string;
  categoryId?: string;
  position?: number;
  isFeatured?: boolean;
  locale?: string;
  reason?: string;
  meta?: any;
  validFrom?: Date | null;
  validTo?: Date | null;
}

export async function attachProductToCategory(
  productId: string,
  categoryId: string,
  params: AttachProductToCategoryParams = {}
) {
  try {
    // Validate inputs
    if (!productId || !categoryId) {
      throw new Error('Product ID and Category ID are required');
    }

    // Check if product and category exist
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    if (!product) {
      throw new Error(`Product with ID ${productId} does not exist`);
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });
    if (!category) {
      throw new Error(`Category with ID ${categoryId} does not exist`);
    }

    // Check if a non-deleted link already exists
    let existingLink = await db.query.productCategoryLinks.findFirst({
      where: and(
        eq(productCategoryLinks.productId, productId),
        eq(productCategoryLinks.categoryId, categoryId),
        isNull(productCategoryLinks.deletedAt)
      ),
    });

    // If link exists and params are provided, update it
    if (existingLink && Object.keys(params).length > 0) {
      await db
        .update(productCategoryLinks)
        .set({
          position: params.position ?? existingLink.position,
          isFeatured: params.isFeatured ?? existingLink.isFeatured,
          locale: params.locale ?? existingLink.locale,
          reason: params.reason ?? existingLink.reason,
          meta: params.meta ?? existingLink.meta,
          validFrom: params.validFrom ?? existingLink.validFrom,
          validTo: params.validTo ?? existingLink.validTo,
          updatedAt: new Date(), // Use proper Date object
        })
        .where(
          and(
            eq(productCategoryLinks.productId, productId),
            eq(productCategoryLinks.categoryId, categoryId),
            isNull(productCategoryLinks.deletedAt) // Only update non-deleted links
          )
        );

      // Log the event
      await db.insert(linkEvents).values({
        entityType: 'product_category',
        entityId: existingLink.id,
        action: 'update',
        oldValues: {
          position: existingLink.position,
          isFeatured: existingLink.isFeatured,
          locale: existingLink.locale,
          reason: existingLink.reason,
          meta: existingLink.meta,
          validFrom: existingLink.validFrom,
          validTo: existingLink.validTo,
        },
        newValues: {
          position: params.position ?? existingLink.position,
          isFeatured: params.isFeatured ?? existingLink.isFeatured,
          locale: params.locale ?? existingLink.locale,
          reason: params.reason ?? existingLink.reason,
          meta: params.meta ?? existingLink.meta,
          validFrom: params.validFrom ?? existingLink.validFrom,
          validTo: params.validTo ?? existingLink.validTo,
        },
        createdAt: new Date(),
      });
    }
    // If no existing link, create a new one
    else if (!existingLink) {
      // Create a new link
      const newLink = await db.insert(productCategoryLinks).values({
        productId,
        categoryId,
        position: params.position || 0,
        isFeatured: params.isFeatured || false,
        locale: params.locale || 'en',
        reason: params.reason || undefined,
        meta: params.meta || undefined,
        validFrom: params.validFrom || null,
        validTo: params.validTo || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ insertedId: productCategoryLinks.id });

      // Log the event
      await db.insert(linkEvents).values({
        entityType: 'product_category',
        entityId: newLink[0].insertedId,
        action: 'attach',
        oldValues: undefined,
        newValues: {
          productId,
          categoryId,
          position: params.position || 0,
          isFeatured: params.isFeatured || false,
          validFrom: params.validFrom || null,
          validTo: params.validTo || null,
        },
        createdAt: new Date(),
      });
    }

    // Revalidate relevant paths
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath('/products');
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    console.error('Error attaching product to category:', error);
    throw error;
  }
}

export async function detachProductFromCategory(
  productId: string,
  categoryId: string
) {
  try {
    // Find the existing link
    const existingLink = await db.query.productCategoryLinks.findFirst({
      where: and(
        eq(productCategoryLinks.productId, productId),
        eq(productCategoryLinks.categoryId, categoryId),
        isNull(productCategoryLinks.deletedAt)
      ),
    });

    if (!existingLink) {
      throw new Error(`No active link found between product ${productId} and category ${categoryId}`);
    }

    // Update the link to mark as deleted
    await db
      .update(productCategoryLinks)
      .set({ 
        deletedAt: new Date(), // Use proper Date object
        updatedAt: new Date(), // Use proper Date object
      })
      .where(
        and(
          eq(productCategoryLinks.productId, productId),
          eq(productCategoryLinks.categoryId, categoryId)
        )
      );

    // Log the event
    await db.insert(linkEvents).values({
      entityType: 'product_category',
      entityId: existingLink.id,
      action: 'detach',
      oldValues: {
        productId,
        categoryId,
        position: existingLink.position,
        isFeatured: existingLink.isFeatured,
      },
      newValues: { deleted: true },
      createdAt: new Date(),
    });

    // Revalidate relevant paths
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath('/products');
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    console.error('Error detaching product from category:', error);
    throw error;
  }
}

export async function getProductsInCategoryOnDate(
  categoryId: string,
  date: string // Format: 'YYYY-MM-DD'
) {
  try {
    // Validate inputs
    if (!categoryId || !date) {
      throw new Error('Category ID and date are required');
    }

    // Convert date string to Date object
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Query products in category with valid date ranges
    const productsInCategory = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Include link-specific fields
        validFrom: productCategoryLinks.validFrom,
        validTo: productCategoryLinks.validTo,
        position: productCategoryLinks.position,
        isFeatured: productCategoryLinks.isFeatured,
        locale: productCategoryLinks.locale,
        reason: productCategoryLinks.reason,
        meta: productCategoryLinks.meta,
      })
      .from(products)
      .innerJoin(
        productCategoryLinks,
        and(
          eq(products.id, productCategoryLinks.productId),
          eq(productCategoryLinks.categoryId, categoryId),
          isNull(productCategoryLinks.deletedAt)
        )
      )
      .where(
        and(
          lte(productCategoryLinks.validFrom, dateObj), // validFrom <= date
          gte(productCategoryLinks.validTo, dateObj),   // validTo >= date
          isNull(productCategoryLinks.deletedAt)
        )
      )
      .orderBy(productCategoryLinks.position);

    return productsInCategory;
  } catch (error) {
    console.error('Error getting products in category on date:', error);
    throw error;
  }
}