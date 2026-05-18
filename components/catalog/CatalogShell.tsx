'use client';

import { motion } from 'framer-motion';
import { CATALOG_TABS, type CatalogTabId } from '@/lib/catalog-config';

type CatalogShellProps = {
  active: CatalogTabId;
  productCount: number;
  children: React.ReactNode;
};

export default function CatalogShell({ active, productCount, children }: CatalogShellProps) {
  const page = CATALOG_TABS.find((t) => t.id === active)!;

  return (
    <motion.div
      className="min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <section className="relative border-b border-gray-200 dark:border-neutral-800 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-600/[0.04] via-transparent to-pink-600/[0.06] dark:from-purple-500/[0.08] dark:to-pink-500/[0.05]"
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            className="flex flex-col items-center text-center gap-6 md:gap-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center px-4 py-1.5 text-[10px] font-semibold tracking-[0.25em] uppercase text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-sm">
              {page.badge}
            </span>

            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-gray-900 dark:text-white max-w-3xl">
              {page.title}
            </h1>

            <p className="text-base md:text-lg font-light text-gray-600 dark:text-neutral-400 max-w-xl leading-relaxed">
              {page.subtitle}
            </p>

            <div className="h-px w-20 bg-gradient-to-r from-purple-600 to-pink-600" />

            <p className="text-sm text-gray-500 dark:text-neutral-500 tracking-wide">
              {productCount}{' '}
              {productCount === 1 ? 'товар' : productCount < 5 ? 'товара' : 'товаров'}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {children}
        </motion.div>
      </section>
    </motion.div>
  );
}
