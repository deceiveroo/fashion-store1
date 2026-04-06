import { Suspense } from 'react';
import { db } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHero from '@/components/PageHero';
import { unstable_cache } from 'next/cache';

// Cache the product fetching to improve performance
const getCachedProducts = unstable_cache(
  async () => {
    // Fetch all products with their images in a single query to avoid N+1
    const productsWithImages = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: products.inStock,
        featured: products.featured,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        imageId: productImages.id,
        imageUrl: productImages.url,
        imageIsMain: productImages.isMain,
        imageOrder: productImages.order,
      })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .orderBy(desc(products.createdAt), productImages.order);

    // Group images by product ID
    const groupedProducts = productsWithImages.reduce((acc, item) => {
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
      description: string | null;
      price: string;
      inStock: boolean | null;
      featured: boolean | null;
      createdAt: Date;
      updatedAt: Date;
      images: Array<{
        id: string;
        url: string;
        isMain: boolean | null;
        order: number | null;
      }>;
    }>);

    // Convert to array and sort by creation date
    const productsArray = Object.values(groupedProducts)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Remove duplicates by ID to prevent React key warnings
    const uniqueProducts = productsArray.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    // Calculate main image for each product
    const productsWithMainImages = uniqueProducts.map((product) => {
      const priceNum = parseFloat(String(product.price ?? '0'));
      return {
        ...product,
        categories: [] as string[],
        price: Number.isFinite(priceNum) ? priceNum : 0,
        mainImage:
          product.images.find((img) => img.isMain)?.url ||
          product.images[0]?.url ||
          '/placeholder-image.jpg',
      };
    });

    return productsWithMainImages;
  },
  ['all-products'],
  { revalidate: 3600 }
);

async function AllProducts() {
  const productsWithImages = await getCachedProducts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {productsWithImages.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default function KollektsiiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <PageHero
        title="Коллекции"
        description="Исследуйте полный ассортимент нашей инновационной одежды. От умных технологий до устойчивых материалов - каждая коллекция рассказывает свою уникальную историю."
      />
      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<LoadingSpinner />}>
            <AllProducts />
          </Suspense>
        </div>
      </section>
    </div>
  );
}