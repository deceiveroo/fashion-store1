import { Suspense } from 'react';
import { db, safeQuery } from '@/lib/db';
import { products, productCategory, productImages, categories } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHero from '@/components/PageHero';
import { unstable_cache } from 'next/cache';

// Cache the product fetching to improve performance
const getCachedNewProducts = unstable_cache(
  async () => {
    try {
      // First, find the category by slug to get its UUID
      const categoryResult = await safeQuery(() =>
        db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, 'new'))
          .limit(1)
      );

      if (!categoryResult || categoryResult.length === 0) {
        console.log('[NEW] Category "new" not found in database');
        return [];
      }

      const categoryId = categoryResult[0].id;

      // Now get the products with their categories using the UUID
      const newProductsResult = await safeQuery(() =>
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
          .innerJoin(productCategory, eq(products.id, productCategory.productId))
          .where(eq(productCategory.categoryId, categoryId))
          .limit(50)
      );

      const newProducts = newProductsResult || [];

      // Remove duplicates by ID to prevent React key warnings
      const uniqueProducts = newProducts.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      // Then fetch all product images at once to avoid N+1 queries
      if (uniqueProducts.length > 0) {
        const productIds = uniqueProducts.map(item => item.id);
        
        // Fetch ALL images in one query
        let allImages: any[] = [];
        const fetchedImages = await safeQuery(() =>
          db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(productImages.order)
        );
        if (fetchedImages) allImages = fetchedImages;

        // Group images by product ID for efficient lookup
        const imagesByProduct = allImages.reduce((acc, img) => {
          if (!acc[img.productId]) {
            acc[img.productId] = [];
          }
          acc[img.productId].push(img);
          return acc;
        }, {} as Record<string, typeof productImages.$inferSelect>);

        // Process products with their images
        const productsWithImages = uniqueProducts.map((item) => {
          const product = item;
          const images = imagesByProduct[product.id] || [];

          // Format images
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
            category: 'Новинки',
            images: formattedImages,
            mainImage: formattedImages.find(img => img.isMain)?.url || formattedImages[0]?.url || '/placeholder-image.jpg'
          };
        });

        return productsWithImages;
      }

      return [];
    } catch (error) {
      console.error('Error fetching new products:', error);
      return [];
    }
  },
  ['new-products'],
  { revalidate: 60 }
);

async function NewProducts() {
  try {
    const productsWithImages = await getCachedNewProducts();

    if (!productsWithImages || productsWithImages.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900">Товары не найдены</h3>
          <p className="mt-1 text-gray-500">Пока нет новых товаров</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {productsWithImages.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error rendering new products:', error);
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-red-600">Ошибка загрузки товаров</h3>
        <p className="mt-1 text-gray-500">Произошла ошибка при загрузке товаров. Пожалуйста, попробуйте позже.</p>
      </div>
    );
  }
}

export default function NewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24 pb-16">
      <PageHero
        title="Новинки"
        description="Покупайте новейшие коллекции первыми. Наши новинки сочетают инновационные материалы и передовой дизайн."
        backgroundImage="/images/new-arrivals-hero.avif"
      />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="bg-gray-200 h-64 w-full" />
                  <div className="p-4 space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4" />
                    <div className="bg-gray-200 h-4 rounded w-1/2" />
                    <div className="bg-gray-200 h-6 rounded w-1/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <NewProducts />
          </Suspense>
        </div>
      </section>
    </div>
  );
}