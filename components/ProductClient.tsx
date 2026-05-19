'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';
import ProductCard from '@/components/product-card';
import type { ProductCardProduct } from '@/components/product-card/types';

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  categories: string[];
  inStock: boolean;
  featured: boolean;
  isNew?: boolean;
  images: ProductImage[];
  mainImage?: string;
}

interface ProductClientProps {
  product: Product;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const getPlaceholderImage = (productId: string): string => {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return `https://picsum.photos/seed/${Math.abs(hash) % 10000}/900/1125`;
};

function toNumberPrice(price: number | string): number {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return Number.isFinite(n) ? n : 0;
}

export default function ProductClient({ product }: ProductClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [related, setRelated] = useState<ProductCardProduct[]>([]);

  const price = toNumberPrice(product.price);

  const allImages = useMemo(() => {
    if (product.images.length > 0) {
      return product.images.filter((img) => img?.url);
    }
    return [{ id: '1', url: getPlaceholderImage(product.id), isMain: true }];
  }, [product.id, product.images]);

  const cartItemData = {
    id: product.id,
    name: product.name,
    price,
    image: allImages[selectedImage]?.url || getPlaceholderImage(product.id),
  };

  const loadRelated = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/recommendations?type=similar&productId=${product.id}&limit=4`
      );
      if (!res.ok) return;
      const data = await res.json();
      const items: ProductCardProduct[] = (data.recommendations ?? []).map(
        (p: {
          id: string;
          name: string;
          description?: string;
          price: string | number;
          stock?: number;
          featured?: boolean;
        }) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? '',
          price: toNumberPrice(p.price),
          categories: product.categories,
          inStock: (p.stock ?? 0) > 0,
          featured: p.featured ?? false,
          mainImage: getPlaceholderImage(p.id),
          images: [],
        })
      );
      setRelated(items);
    } catch {
      /* optional block */
    }
  }, [product.id, product.categories]);

  useEffect(() => {
    void loadRelated();
  }, [loadRelated]);

  const goPrev = () =>
    setSelectedImage((i) => (i === 0 ? allImages.length - 1 : i - 1));
  const goNext = () =>
    setSelectedImage((i) => (i === allImages.length - 1 ? 0 : i + 1));

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-20 pb-20 transition-colors">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="mb-8 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft size={16} aria-hidden />
            Коллекции
          </Link>
          <span className="text-gray-300 dark:text-neutral-700">/</span>
          <span className="text-gray-900 dark:text-white font-light tracking-wide truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.5 }}
        >
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900 group/gallery">
              <AnimatePresence mode="wait">
                <motion.img
                  key={allImages[selectedImage]?.id ?? selectedImage}
                  src={allImages[selectedImage]?.url}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>

              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-500"
                aria-hidden
              />

              {(product.featured || product.isNew) && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                      New
                    </span>
                  )}
                  {product.featured && (
                    <span className="bg-gray-900 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white dark:bg-white dark:text-gray-900">
                      Хит
                    </span>
                  )}
                </div>
              )}

              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Предыдущее фото"
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 p-2 bg-white/90 text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Следующее фото"
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 p-2 bg-white/90 text-gray-900 opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <motion.div
                className="grid grid-cols-4 sm:grid-cols-5 gap-2 md:gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {allImages.map((image, index) => (
                  <button
                    key={image.id ?? index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-label={`Фото ${index + 1}`}
                    aria-current={selectedImage === index}
                    className={`relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900 transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-purple-600 ring-offset-2 dark:ring-offset-neutral-950'
                        : 'opacity-70 hover:opacity-100 ring-1 ring-gray-200 dark:ring-neutral-800'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Info — sticky on desktop */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-8">
              {product.categories[0] && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-600 dark:text-purple-400">
                  {product.categories.join(' · ')}
                </p>
              )}

              <div>
                <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-light leading-tight tracking-tight text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                <div className="mt-4 h-px w-16 bg-gradient-to-r from-purple-600 to-pink-600" />
              </div>

              <p className="text-2xl md:text-3xl font-light text-gray-900 dark:text-white tabular-nums">
                {price.toLocaleString('ru-RU')}&nbsp;₽
              </p>

              <p className="text-base font-light leading-relaxed text-gray-600 dark:text-neutral-400 max-w-md">
                {product.description || 'Премиальная вещь из курируемой коллекции ELEVATE.'}
              </p>

              {/* Sizes */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-500 mb-3">
                  Размер
                </p>
                <motion.div className="flex flex-wrap gap-2" role="listbox" aria-label="Выбор размера">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      role="option"
                      aria-selected={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-4 py-2.5 text-sm font-light border transition-all ${
                        selectedSize === size
                          ? 'border-purple-600 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-500'
                          : 'border-gray-300 text-gray-800 hover:border-purple-400 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-purple-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </motion.div>
              </motion.div>

              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-200 dark:border-neutral-800">
                <motion.div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-neutral-500 block mb-1">
                    Наличие
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      product.inStock
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                </motion.div>
                <motion.div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-neutral-500 block mb-1">
                    Артикул
                  </span>
                  <span className="text-sm font-light text-gray-700 dark:text-neutral-300 uppercase tracking-wide">
                    {product.id}
                  </span>
                </motion.div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {product.inStock ? (
                  <div className="flex-1">
                    <AddToCartButton 
                      product={cartItemData} 
                      size={selectedSize || undefined}
                      disabled={!product.inStock} 
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-neutral-800 text-gray-500 py-3.5 px-6 text-sm cursor-not-allowed"
                  >
                    <ShoppingBag size={18} aria-hidden />
                    Нет в наличии
                  </button>
                )}
                <div className="flex items-center justify-center border border-gray-200 dark:border-neutral-800 px-4">
                  <FavoriteButton productId={product.id} size={22} />
                </div>
              </div>

              {!selectedSize && product.inStock && (
                <p className="text-xs text-orange-500 dark:text-orange-400 font-medium mt-2">
                  ⚠️ Выберите размер перед добавлением в корзину
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Complete the look */}
        {related.length > 0 && (
          <motion.section
            className="mt-20 md:mt-28 pt-16 border-t border-gray-200 dark:border-neutral-800"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <motion.div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-600 dark:text-purple-400 mb-2">
                  Стилист ELEVATE
                </p>
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 dark:text-white tracking-tight">
                  Дополните образ
                </h2>
              </div>
              <Link
                href="/collections"
                className="text-sm text-gray-500 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 transition-colors"
              >
                Вся коллекция →
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} variant="collections" />
              ))}
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}
