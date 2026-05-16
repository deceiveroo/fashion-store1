import { Suspense } from 'react';
import { getCatalogProducts } from '@/lib/catalog-products';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageHero from '@/components/PageHero';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

async function AllProducts() {
  const products = await getCatalogProducts({ limit: 48, fallbackToAll: true });

  if (!products.length) {
    return (
      <div className="text-center py-24">
        <h3 className="text-xl font-light text-gray-900 dark:text-white mb-3">
          Товары скоро появятся
        </h3>
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          Мы работаем над наполнением каталога
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
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
