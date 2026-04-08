import { Suspense } from 'react';
import { db, safeQuery } from '@/lib/db';
import { products, productCategory, productImages, categories } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import ProductCard from '@/components/ProductCard';
import PageHero from '@/components/PageHero';
import { unstable_cache } from 'next/cache';
import CategoryHeader from '@/components/CategoryHeader';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

// Cache the product fetching to improve performance
const getCachedWomenProducts = unstable_cache(
  async () => {
    try {
      // First, find the category by slug to get its UUID
      const categoryResult = await safeQuery(() =>
        db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, 'women'))
          .limit(1)
      );

      if (!categoryResult || categoryResult.length === 0) {
        console.log('[WOMEN] Category "women" not found in database');
        return [];
      }

      const categoryId = categoryResult[0].id;

      // Now get the products with their categories using the UUID
      const womenProductsResult = await safeQuery(() =>
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

      const womenProducts = womenProductsResult || [];

      // Remove duplicates by ID to prevent React key warnings
      const uniqueProducts = womenProducts.filter((product, index, self) =>
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
        const productsWithImages = uniqueProducts.map((product) => {
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
            category: 'Женское',
            images: formattedImages,
            mainImage: formattedImages.find(img => img.isMain)?.url || formattedImages[0]?.url || '/placeholder-image.jpg'
          };
        });

        return productsWithImages;
      }

      return [];
    } catch (error) {
      console.error('Error fetching women products:', error);
      return [];
    }
  },
  ['women-products'],
  { revalidate: 60 }
);

async function WomenProducts() {
  try {
    const productsWithImages = await getCachedWomenProducts();

    if (!productsWithImages || productsWithImages.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 mb-6">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Товары не найдены</h3>
          <p className="text-gray-600 dark:text-gray-400">Пока нет товаров в категории "Женское"</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {productsWithImages.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error rendering women products:', error);
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

export default function WomenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-20">
      <PageHero
        title="Женское"
        description="Инновационная женская одежда, сочетающая передовые технологии с безупречным стилем. От умных платьев до технологичных аксессуаров."
        backgroundImage="/images/women-fashion-hero.avif"
      />
      
      <CategoryHeader 
        title="Женская коллекция"
        description="Откройте для себя элегантность и стиль, созданные для современной женщины"
        icon="female"
      />
      
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <WomenProducts />
          </Suspense>
        </div>
      </section>
    </div>
  );
}