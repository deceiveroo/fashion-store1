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

  const countLabel = `${productCount} ${
    productCount === 1 ? 'товар' : productCount % 10 >= 2 && productCount % 10 <= 4 && (productCount < 10 || productCount > 20) ? 'товара' : 'товаров'
  }`;

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-neutral-50 transition-colors duration-300 dark:bg-[#191926]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Фоновая подложка. z-0 (не отрицательный!) — иначе уходит за сплошной
          фон родителя и в тёмной теме страница выглядит просто чёрной. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {/* Базовый вертикальный градиент — мягко осветляет верх (не плоский цвет) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/0 dark:from-[#22223a] dark:via-[#191926] dark:to-[#14141f]" />
        {/* Цветное сияние сверху */}
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.30),transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.45),transparent_72%)]" />
        {/* Тёплое пятно справа */}
        <div className="absolute right-[-8%] top-[15%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.22),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(236,72,153,0.34),transparent_72%)]" />
        {/* Холодное пятно слева снизу — для глубины */}
        <div className="absolute bottom-[-8%] left-[-8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.16),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(129,140,248,0.32),transparent_72%)]" />
      </div>

      {/* Hero */}
      <section className="relative z-10 overflow-hidden border-b border-gray-200/70 dark:border-white/[0.08]">
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div
            className="flex flex-col items-center gap-6 text-center md:gap-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-700 shadow-sm backdrop-blur-md dark:border-purple-800/50 dark:bg-white/5 dark:text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              {page.badge}
            </span>

            <h1 className="max-w-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-4xl font-light tracking-tight text-transparent dark:from-white dark:via-neutral-100 dark:to-neutral-400 md:text-6xl">
              {page.title}
            </h1>

            <p className="max-w-xl text-base font-light leading-relaxed text-gray-600 dark:text-neutral-400 md:text-lg">
              {page.subtitle}
            </p>

            <div className="mt-1 inline-flex items-center gap-3 text-sm text-gray-500 dark:text-neutral-500">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-purple-500/60" />
              <span className="tracking-wide tabular-nums">{countLabel}</span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-pink-500/60" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <motion.div
          className="mx-auto max-w-7xl"
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
