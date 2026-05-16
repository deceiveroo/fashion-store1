'use client';

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import ProductCard from './ProductCard';
import { History, Trash2 } from 'lucide-react';

export default function RecentlyViewedSection() {
  const { viewedProducts, clearHistory } = useRecentlyViewed();

  if (viewedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Недавно просмотренные
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ваши последние просмотры
              </p>
            </div>
          </div>
          
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Очистить
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {viewedProducts.slice(0, 10).map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                description: '',
                price: product.price,
                categories: [],
                inStock: true,
                featured: false,
                mainImage: product.mainImage,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
