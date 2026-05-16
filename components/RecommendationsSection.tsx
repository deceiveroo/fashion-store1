'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { ChevronRight, Sparkles, TrendingUp, Star, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  mainImage?: string;
  images?: { id: string; url: string; isMain: boolean }[];
}

interface RecommendationsSectionProps {
  productId?: string;
  categoryId?: string;
  type?: 'similar' | 'frequently_bought' | 'new_in_category' | 'trending' | 'curated';
  collectionSlug?: string;
  title?: string;
  subtitle?: string;
}

const typeConfig = {
  similar: {
    icon: Package,
    defaultTitle: 'Похожие товары',
    defaultSubtitle: 'Вам может понравиться',
  },
  frequently_bought: {
    icon: Star,
    defaultTitle: 'Часто покупают вместе',
    defaultSubtitle: 'Идеальные комбинации',
  },
  new_in_category: {
    icon: Sparkles,
    defaultTitle: 'Новинки',
    defaultSubtitle: 'Свежие поступления',
  },
  trending: {
    icon: TrendingUp,
    defaultTitle: 'Популярное сейчас',
    defaultSubtitle: 'Хиты этой недели',
  },
  curated: {
    icon: Star,
    defaultTitle: 'Выбор редакции',
    defaultSubtitle: 'Рекомендуем специально для вас',
  },
};

export default function RecommendationsSection({
  productId,
  categoryId,
  type = 'similar',
  collectionSlug,
  title,
  subtitle,
}: RecommendationsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = typeConfig[type];
  const displayTitle = title || config.defaultTitle;
  const displaySubtitle = subtitle || config.defaultSubtitle;
  const Icon = config.icon;

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          type,
          limit: '6',
        });

        if (productId) params.append('productId', productId);
        if (categoryId) params.append('categoryId', categoryId);
        if (collectionSlug) params.append('collectionSlug', collectionSlug);

        const response = await fetch(`/api/recommendations?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setProducts(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Не удалось загрузить рекомендации');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [type, productId, categoryId, collectionSlug]);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayTitle}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {displaySubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Link (optional) */}
        {products.length >= 6 && (
          <div className="mt-8 text-center">
            <button className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors group">
              Смотреть все
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
