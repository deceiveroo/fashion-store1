import { Suspense } from 'react';
import { db, safeQuery } from '@/lib/db';
import { products, productImages } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import ProductCard from '@/components/ProductCard';
import PageHero from '@/components/PageHero';
import { unstable_cache } from 'next/cache';
import CollectionsHeader from '@/components/CollectionsHeader';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

const getCachedFeaturedProducts = unstable_cache(
  async () => {
    try {
      const featuredProductsResult = await safeQuery(() =>
        db
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            inStock: products.inStock,
            featured: products.featured,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
          })
          .from(products)
          .where(eq(products.featured, true))
          .limit(50)
      );

      const featuredProducts = featuredProductsResult || [];
      const uniqueProducts = featuredProducts.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      if (uniqueProducts.length > 0) {
        const productIds = uniqueProducts.map(item => item.id);
        
        let allImages: any[] = [];
        const fetchedImages = await safeQuery(() =>
          db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(productImages.order)
        );
        if (fetchedImages) allImages = fetchedImages;

        const imagesByProduct = allImages.reduce((acc, img) => {
          if (!acc[img.productId]) {
            acc[img.productId] = [];
          }
          acc[img.productId].push(img);
          return acc;
        }, {} as Record<string, typeof productImages.$inferSelect>);

        const productsWithImages = uniqueProducts.map((product) => {
          const images = imagesByProduct[product.id] || [];
          const formattedImages = images.map(img => ({
            id: img.id,
            url: img.url,
            isMain: img.isMain ?? false
          }));

          const priceNum = parseFloat(String(product.price ?? '0'));

          return {
            ...product,
            categories: [] as string[],
            price: Number.isFinite(priceNum) ? priceNum : 0,
            inStock: product.inStock ?? true,
            featured: product.featured ?? false,
            category: 'Коллекции',
            images: formattedImages,
            mainImage: formattedImages.find(img => img.isMain)?.url || formattedImages[0]?.url || '/placeholder-image.jpg'
          };
        });

        return productsWithImages;
      }

      return [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },
  ['featured-products'],
  { revalidate: 60 }
);

async function FeaturedProducts() {
  try {
    const productsWithImages = await getCachedFeaturedProducts();

    if (!productsWithImages || productsWithImages.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 mb-6">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Товары не найдены</h3>
          <p className="text-gray-600 dark:text-gray-400">Пока нет избранных товаров в коллекции</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {productsWithImages.map((product, index) => (
          <div
            key={product.id}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error rendering featured products:', error);
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Ошибка загрузки товаров</h3>
        <p className="text-gray-600 dark:text-gray-400">Произошла ошибка при загрузке товаров. Пожалуйста, попробуйте позже.</p>
      </div>
    );
  }
}

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20">
      <PageHero
        title="Коллекции"
        description="Исследуйте наши избранные коллекции. Каждая коллекция представляет собой уникальное сочетание стиля, качества и инноваций."
        backgroundImage="/images/pradasphere_home_DT.webp"
      />
      
      <CollectionsHeader />
      
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
