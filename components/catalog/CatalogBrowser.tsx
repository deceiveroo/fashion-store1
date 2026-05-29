'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Check } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog-products';
import type { ProductCardVariant } from '@/components/product-card/types';
import CatalogProductGrid from './CatalogProductGrid';

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'new';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Популярные' },
  { value: 'new', label: 'Сначала новинки' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
];

type CatalogBrowserProps = {
  products: CatalogProduct[];
  variant: ProductCardVariant;
};

export default function CatalogBrowser({ products, variant }: CatalogBrowserProps) {
  const [sort, setSort] = useState<SortKey>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Верхняя граница цены — для слайдера. Округляем вверх до сотни.
  const maxPrice = useMemo(() => {
    const max = products.reduce((m, p) => (p.price > m ? p.price : m), 0);
    return Math.max(100, Math.ceil(max / 100) * 100);
  }, [products]);

  const [priceCap, setPriceCap] = useState<number>(maxPrice);

  const filtered = useMemo(() => {
    let list = products;
    if (inStockOnly) list = list.filter((p) => p.inStock);
    if (priceCap < maxPrice) list = list.filter((p) => p.price <= priceCap);

    const sorted = [...list];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case 'popular':
      default:
        sorted.sort(
          (a, b) =>
            b.reviewCount - a.reviewCount ||
            b.rating - a.rating ||
            Number(b.featured) - Number(a.featured)
        );
        break;
    }
    return sorted;
  }, [products, sort, inStockOnly, priceCap, maxPrice]);

  const priceFilterActive = priceCap < maxPrice;

  return (
    <div className="space-y-8">
      {/* Sticky frosted toolbar */}
      <div className="sticky top-16 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-900/70 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-300">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <span className="tabular-nums">
              {filtered.length}{' '}
              <span className="text-gray-400 dark:text-neutral-500">
                {filtered.length === 1 ? 'товар' : filtered.length < 5 ? 'товара' : 'товаров'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
            {/* В наличии */}
            <button
              type="button"
              onClick={() => setInStockOnly((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium tracking-wide transition-all ${
                inStockOnly
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm dark:border-purple-500/60 dark:bg-purple-500/15 dark:text-purple-200'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50'
              }`}
              aria-pressed={inStockOnly}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border transition-colors ${
                  inStockOnly ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-neutral-600'
                }`}
              >
                {inStockOnly && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
              Только в наличии
            </button>

            {/* Цена */}
            <div className="flex items-center gap-2.5 rounded-full border border-gray-200 px-4 py-2 dark:border-neutral-700">
              <label className="whitespace-nowrap text-xs text-gray-500 dark:text-neutral-400">
                до{' '}
                <span className={priceFilterActive ? 'font-semibold text-purple-600 dark:text-purple-400' : 'font-medium text-gray-700 dark:text-neutral-300'}>
                  {priceCap.toLocaleString('ru-RU')}&nbsp;₽
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={maxPrice}
                step={100}
                value={priceCap}
                onChange={(e) => setPriceCap(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer accent-purple-600 md:w-32"
                aria-label="Максимальная цена"
              />
            </div>

            {/* Сортировка */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none rounded-full border border-gray-200 bg-white px-4 py-2 pr-9 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 focus:border-purple-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
                aria-label="Сортировка"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Грид (переиспользуем серверную карточку) */}
      {filtered.length === 0 ? (
        <motion.div
          className="py-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="mb-2 text-lg font-light text-gray-900 dark:text-white">
            Ничего не найдено
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Попробуйте изменить фильтры
          </p>
        </motion.div>
      ) : (
        <CatalogProductGrid products={filtered} variant={variant} />
      )}
    </div>
  );
}
