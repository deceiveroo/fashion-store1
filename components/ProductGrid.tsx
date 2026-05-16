import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { productListSelect } from '@/lib/product-query';
import { desc, eq } from 'drizzle-orm';
import ProductCard from './ProductCard';

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
  mainImage?: string;
}

async function getProducts(): Promise<Product[]> {
  const productsWithImages = await db
    .select({
      ...productListSelect,
      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsMain: productImages.isMain,
      imageOrder: productImages.order,
    })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .orderBy(desc(products.createdAt), productImages.order);

  const groupedProducts = productsWithImages.reduce(
    (acc, item) => {
      if (!acc[item.id]) {
        acc[item.id] = {
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          price: parseFloat(String(item.price ?? '0')),
          inStock: item.inStock,
          featured: item.featured,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          images: [] as ProductImage[],
        };
      }

      if (item.imageId && item.imageUrl) {
        acc[item.id].images.push({
          id: item.imageId,
          url: item.imageUrl,
          isMain: item.imageIsMain ?? false,
          order: item.imageOrder ?? 0,
        });
      }

      return acc;
    },
    {} as Record<string, Product>
  );

  return Object.values(groupedProducts).map((product) => ({
    ...product,
    mainImage:
      product.images.find((img) => img.isMain)?.url ||
      product.images[0]?.url ||
      '/placeholder-image.jpg',
  }));
}

export default async function ProductGrid() {
  const productList = await getProducts();

  if (productList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Товары не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {productList.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
