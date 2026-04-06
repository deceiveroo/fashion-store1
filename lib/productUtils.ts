import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { eq, inArray, desc } from 'drizzle-orm';

// Helper function with retry logic for Supabase pooler
async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      const isConnectionError = 
        error.message?.includes('Connection terminated') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('Pool is draining and cannot accept new connections') ||
        error.code === 'ECONNRESET';
      
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Query failed (attempt ${i + 1}), retrying...`, error.message);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Получает продукты с их изображениями за один запрос
 */
export async function getProductsForDisplay() {
  try {
    // Получаем все продукты с изображениями в одном запросе
    const productsWithImages = await queryWithRetry(() =>
      db
        .select({
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
          imageId: productImages.id,
          imageUrl: productImages.url,
          imageIsMain: productImages.isMain,
          imageOrder: productImages.order,
        })
        .from(products)
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .orderBy(desc(products.createdAt), productImages.order)
    );

    // Группируем изображения по продуктам
    const groupedProducts = productsWithImages.reduce((acc, item) => {
      if (!acc[item.id]) {
        acc[item.id] = {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          inStock: item.inStock,
          featured: item.featured,
          position: item.position,
          isFeatured: item.isFeatured,
          locale: item.locale,
          meta: item.meta,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          images: [],
        };
      }

      if (item.imageId) {
        acc[item.id].images.push({
          id: item.imageId,
          url: item.imageUrl,
          isMain: item.imageIsMain,
          order: item.imageOrder,
        });
      }

      return acc;
    }, {} as Record<string, {
      id: string;
      name: string;
      description: string;
      price: number;
      inStock: boolean;
      featured: boolean;
      position: number;
      isFeatured: boolean;
      locale: string;
      meta: any;
      createdAt: Date;
      updatedAt: Date;
      images: Array<{
        id: string;
        url: string;
        isMain: boolean;
        order: number;
      }>;
    }>);

    // Конвертируем в массив и сортируем
    const productsArray = Object.values(groupedProducts)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Удаляем дубликаты
    const uniqueProducts = productsArray.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    // Формируем главное изображение
    return uniqueProducts.map(product => ({
      ...product,
      mainImage: product.images.find(img => img.isMain)?.url || 
                 product.images[0]?.url || 
                 '/placeholder-image.jpg'
    }));
  } catch (error) {
    console.error('Error fetching products with images:', error);
    throw error;
  }
}

/**
 * Получает продукт по ID с его изображениями
 */
export async function getProductById(productId: string) {
  try {
    const productData = await queryWithRetry(() =>
      db
        .select({
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
          imageId: productImages.id,
          imageUrl: productImages.url,
          imageIsMain: productImages.isMain,
          imageOrder: productImages.order,
        })
        .from(products)
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(products.id, productId))
        .orderBy(productImages.order)
    );

    if (productData.length === 0) {
      return null;
    }

    const firstProduct = productData[0];
    const images = productData
      .filter(item => item.imageId)
      .map(item => ({
        id: item.imageId!,
        url: item.imageUrl,
        isMain: item.imageIsMain ?? false,
        order: item.imageOrder,
      }));

    return {
      id: firstProduct.id,
      name: firstProduct.name,
      description: firstProduct.description,
      price: firstProduct.price,
      inStock: firstProduct.inStock ?? true,
      featured: firstProduct.featured ?? false,
      position: firstProduct.position,
      isFeatured: firstProduct.isFeatured ?? false,
      locale: firstProduct.locale,
      meta: firstProduct.meta,
      createdAt: firstProduct.createdAt,
      updatedAt: firstProduct.updatedAt,
      images,
      mainImage: images.find(img => img.isMain)?.url || 
                 images[0]?.url || 
                 '/placeholder-image.jpg'
    };
  } catch (error) {
    console.error(`Error fetching product with ID ${productId}:`, error);
    throw error;
  }
}

/**
 * Получает продукты по категории с их изображениями
 */
export async function getProductsByCategory(categoryId: string) {
  // Заметка: для этой функции потребуется доступ к таблице productCategory
  // который мы не импортировали, но в текущем файле не используем
  // реализация будет зависеть от структуры вашей БД
  console.warn('getProductsByCategory requires productCategory table access - implement as needed');
  return [];
}