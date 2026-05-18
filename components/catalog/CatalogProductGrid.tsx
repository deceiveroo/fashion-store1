'use client';

import { motion } from 'framer-motion';
import ProductCard from '@/components/product-card';
import type { ProductCardVariant } from '@/components/product-card/types';
import type { CatalogProduct } from '@/lib/catalog-products';

type CatalogProductGridProps = {
  products: CatalogProduct[];
  variant: ProductCardVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: { title: string; subtitle: string };
};

export default function CatalogProductGrid({
  products,
  variant,
  emptyTitle = 'Товары не найдены',
  emptyDescription = 'Скоро появятся новые позиции в каталоге',
  emptyMessage,
}: CatalogProductGridProps) {
  if (!products.length) {
    const message = emptyMessage || { title: emptyTitle, subtitle: emptyDescription };
    return (
      <motion.div
        className="text-center py-24 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="text-xl font-light text-gray-900 dark:text-white mb-3 tracking-wide">
          {message.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
          {message.subtitle}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-6 md:gap-y-12">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            delay: Math.min(index * 0.05, 0.35),
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ProductCard product={product} variant={variant} />
        </motion.div>
      ))}
    </div>
  );
}
