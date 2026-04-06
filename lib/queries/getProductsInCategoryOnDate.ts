import { db } from '@/lib/db';
import { 
  productCategoryLinks, 
  products, 
  categories,
  productImages
} from '@/lib/db/schema';
import { eq, and, lte, gte, isNull } from 'drizzle-orm';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export async function getProductsInCategoryByIdOnDate(
  categoryId: string,
  date: Date // Date object instead of timestamp
) {
  try {
    // Convert date to just the date part (without time) for comparison
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateObj = new Date(dateStr);

    const result = await db
      .select({
        // Product fields
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: products.inStock,
        featured: products.featured,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        
        // Category link fields
        validFrom: productCategoryLinks.validFrom,
        validTo: productCategoryLinks.validTo,
        
        // Product images
        images: productImages,
      })
      .from(products)
      .innerJoin(
        productCategoryLinks, 
        and(
          eq(productCategoryLinks.productId, products.id),
          eq(productCategoryLinks.categoryId, categoryId),
          // Check if the product was valid on the given date
          lte(productCategoryLinks.validFrom, dateObj), // validFrom <= date
          gte(productCategoryLinks.validTo, dateObj),   // validTo >= date
          isNull(productCategoryLinks.deletedAt)        // Not soft deleted
        )
      )
      .leftJoin(
        productImages,
        eq(productImages.productId, products.id)
      )
      .where(eq(products.inStock, true)); // Only in-stock products

    return result;
  } catch (error) {
    console.error('Error fetching products in category on date:', error);
    return [];
  }
}

/**
 * Retrieves products that were linked to a category at a specific date
 * considering the validFrom and validTo dates of the links
 * 
 * @param slug The category slug
 * @param date The date to check for (Date object)
 * @returns Array of products linked to the category at that specific date
 */
export async function getProductsInCategoryOnDate(slug: string, date: Date) {
  try {
    // Convert date to midnight for consistent day-based comparison
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Find the category by slug
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!category) {
      throw new Error(`Category with slug "${slug}" does not exist`);
    }

    // Query products that were linked to this category at the specified date
    const result = await db
      .select({
        // Product fields
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: products.inStock,
        featured: products.featured,
        position: products.position,
        isFeatured: products.isFeatured,
        locale: products.locale,
        meta: products.meta,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Category link fields
        validFrom: productCategoryLinks.validFrom,
        validTo: productCategoryLinks.validTo,
        linkPosition: productCategoryLinks.position,
        linkIsFeatured: productCategoryLinks.isFeatured,
        linkLocale: productCategoryLinks.locale,
        linkReason: productCategoryLinks.reason,
        linkMeta: productCategoryLinks.meta,
        linkCreatedAt: productCategoryLinks.createdAt,
        linkUpdatedAt: productCategoryLinks.updatedAt,
        // Product images
        images: productImages,
      })
      .from(products)
      .innerJoin(
        productCategoryLinks,
        and(
          eq(products.id, productCategoryLinks.productId),
          eq(productCategoryLinks.categoryId, category.id),
          // Check that the link was valid at the specified date
          lte(productCategoryLinks.validFrom, dateObj), // validFrom <= date
          gte(productCategoryLinks.validTo, dateObj),  // validTo >= date
          // Ensure the link is not soft-deleted
          isNull(productCategoryLinks.deletedAt)
        )
      )
      .leftJoin(
        productImages,
        eq(productImages.productId, products.id)
      )
      .where(eq(products.inStock, true)); // Only in-stock products

    return {
      success: true,
      data: result,
      message: `Found ${result.length} products in category "${slug}" on ${format(dateObj, 'yyyy-MM-dd')}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get products in category on date: ${error instanceof Error ? error.message : String(error)}`,
      data: [],
    };
  }
}