'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CATALOG_TABS, type CatalogTabId } from '@/lib/catalog-config';

type CatalogShellProps = {
  active: CatalogTabId;
  productCount: number;
  children: React.ReactNode;
};

export default function CatalogShell({ active, productCount, children }: CatalogShellProps) {
  const pathname = usePathname();
  const page = CATALOG_TABS.find((t) => t.id === active)!;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-300">
      {/* HERO SECTION - Минималистичный и элегантный */}
      <section className="relative border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col items-center text-center gap-8">
            {/* Бейдж */}
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 text-xs font-medium tracking-[0.2em] uppercase text-gray-600 dark:text-neutral-400 border border-gray-300 dark:border-neutral-700"
            >
              {page.badge}
            </motion.span>

            {/* Заголовок - элегантная типографика */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-light tracking-tight text-gray-900 dark:text-white"
            >
              {page.title}
            </motion.h1>

            {/* Подзаголовок */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-gray-600 dark:text-neutral-400 max-w-2xl font-light"
            >
              {page.subtitle}
            </motion.p>

            {/* Разделительная линия */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-24 h-px bg-gray-300 dark:bg-neutral-700"
            />

            {/* Счётчик товаров */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-gray-500 dark:text-neutral-500 tracking-wide"
            >
              {productCount} {productCount === 1 ? 'товар' : productCount < 5 ? 'товара' : 'товаров'}
            </motion.div>
          </div>
        </div>
      </section>

      {/* КОНТЕНТ */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </section>
    </div>
  );
}
