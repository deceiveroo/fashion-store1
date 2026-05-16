import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { productListSelect } from '@/lib/product-query';
import { eq, desc } from 'drizzle-orm';

async function queryWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;

      const isConnectionError =
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('Pool is draining and cannot accept new connections') ||
        errorCode === 'ECONNRESET';

      if (isConnectionError && i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  imageId: string | null;
  imageUrl: string | null;
  imageIsMain: boolean | null;
  imageOrder: number | null;
};

export async function getProductsForDisplay() {
  const productsWithImages = await queryWithRetry(() =>
    db
      .select({
        ...productListSelect,
        imageId: productImages.id,
        imageUrl: productImages.url,
        imageIsMain: productImages.isMain,
        imageOrder: productImages.order,
      })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .orderBy(desc(products.createdAt), productImages.order)
  );

  const groupedProducts = productsWithImages.reduce(
    (acc, item) => {
      if (!acc[item.id]) {
        acc[item.id] = {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          inStock: item.inStock,
          featured: item.featured,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          images: [] as Array<{ id: string; url: string; isMain: boolean; order: number | null }>,
        };
      }

      if (item.imageId && item.imageUrl) {
        acc[item.id].images.push({
          id: item.imageId,
          url: item.imageUrl,
          isMain: item.imageIsMain ?? false,
          order: item.imageOrder,
        });
      }

      return acc;
    },
    {} as Record<string, Omit<ProductRow, 'imageId' | 'imageUrl' | 'imageIsMain' | 'imageOrder'> & { images: Array<{ id: string; url: string; isMain: boolean; order: number | null }> }>
  );

  return Object.values(groupedProducts)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((product) => ({
      ...product,
      mainImage:
        product.images.find((img) => img.isMain)?.url ||
        product.images[0]?.url ||
        '/placeholder-image.jpg',
    }));
}

export async function getProductById(productId: string) {
  const productData = await queryWithRetry(() =>
    db
      .select({
        ...productListSelect,
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

  if (productData.length === 0) return null;

  const firstProduct = productData[0];
  const images = productData
    .filter((item) => item.imageId && item.imageUrl)
    .map((item) => ({
      id: item.imageId!,
      url: item.imageUrl!,
      isMain: item.imageIsMain ?? false,
      order: item.imageOrder,
    }));

  return {
    id: firstProduct.id,
    name: firstProduct.name,
    description: firstProduct.description,
    price: firstProduct.price,
    inStock: firstProduct.inStock,
    featured: firstProduct.featured,
    createdAt: firstProduct.createdAt,
    updatedAt: firstProduct.updatedAt,
    images,
    mainImage:
      images.find((img) => img.isMain)?.url || images[0]?.url || '/placeholder-image.jpg',
  };
}

export async function getProductsByCategory(_categoryId: string) {
  return [];
}
