'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  Ruler,
  ShieldCheck,
  ArrowUpRight,
  Wand2,
} from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';
import ProductCard from '@/components/product-card';
import type { ProductCardProduct } from '@/components/product-card/types';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import SizeAdvisorModal from '@/components/SizeAdvisorModal';
import ColorSelector, { type ColorOption } from '@/components/product/ColorSelector';
import ProductGallery from '@/components/product/ProductGallery';

// Единая кривая входной анимации (общая с ProductGallery). На уровне модуля —
// чтобы не пересоздавать массив на каждый рендер.
const EASE = [0.22, 1, 0.36, 1] as const;

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  mediaType?: 'image' | 'video';
  duration?: number;
  thumbnailUrl?: string;
  color?: string | null;
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
  sizes?: Array<{
    id: string;
    sizeName?: string | null;
    size_name?: string | null;
    sizeType?: string | null;
    size_type?: string | null;
    inStock?: boolean | null;
    in_stock?: boolean | null;
    stockCount?: number | null;
    stock_count?: number;
  }>;
  brand?: string | null;
  country?: string | null;
  composition?: string | null;
  compositionSecondary?: string | null;
  color?: string | null;
  articleNumber?: string | null;
  productCode?: string | null;
  modelParams?: string | null;
}

interface ProductClientProps {
  product: Product;
}

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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSizeAdvisorOpen, setIsSizeAdvisorOpen] = useState(false);

  const availableSizes = useMemo(() => {
    return product.sizes?.map(s => s.sizeName || s.size_name || '').filter(Boolean) as string[] || [];
  }, [product.sizes]);

  const imageColorNames = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const img of product.images) {
      const c = img?.color?.trim();
      if (c && !seen.has(c)) {
        seen.add(c);
        order.push(c);
      }
    }
    return order;
  }, [product.images]);

  const colorOptions = useMemo<ColorOption[]>(() => {
    if (imageColorNames.length > 0) {
      return imageColorNames.map((name) => {
        const img = product.images.find((i) => i?.color?.trim() === name && i?.url);
        return {
          id: name,
          name,
          image: img?.url || product.mainImage || getPlaceholderImage(product.id),
        };
      });
    }
    if (product.color) {
      const firstImage = product.images.find((i) => i?.url)?.url
        || product.mainImage
        || getPlaceholderImage(product.id);
      return [{ id: product.color, name: product.color, image: firstImage }];
    }
    return [];
  }, [imageColorNames, product.color, product.images, product.mainImage, product.id]);

  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    () => colorOptions[0]?.id ?? null
  );

  useEffect(() => {
    if (!selectedColorId && colorOptions.length > 0) {
      setSelectedColorId(colorOptions[0].id);
    }
  }, [colorOptions, selectedColorId]);

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColorId]);

  const price = toNumberPrice(product.price);

  const allImages = useMemo(() => {
    const valid = product.images.filter((img) => img?.url);
    if (valid.length > 0) {
      if (imageColorNames.length > 0 && selectedColorId) {
        const filtered = valid.filter((img) => img.color?.trim() === selectedColorId);
        if (filtered.length > 0) return filtered;
      }
      return valid;
    }
    return [{
      id: '1',
      url: getPlaceholderImage(product.id),
      isMain: true,
      mediaType: 'image' as const,
      duration: undefined,
      thumbnailUrl: undefined
    }];
  }, [product.id, product.images, imageColorNames, selectedColorId]);

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
          images?: Array<{ url: string; isMain?: boolean }>;
          mainImage?: string;
        }) => {
          let mainImage = p.mainImage || getPlaceholderImage(p.id);

          if (p.images && p.images.length > 0) {
            const mainImg = p.images.find(img => img.isMain) || p.images[0];
            if (mainImg?.url) {
              mainImage = mainImg.url;
            }
          }

          return {
            id: p.id,
            name: p.name,
            description: p.description ?? '',
            price: toNumberPrice(p.price),
            categories: product.categories,
            inStock: (p.stock ?? 0) > 0,
            featured: p.featured ?? false,
            mainImage,
            images: p.images || [],
          };
        }
      );
      setRelated(items);
    } catch {
      /* optional block */
    }
  }, [product.id, product.categories]);

  useEffect(() => {
    void loadRelated();
  }, [loadRelated]);

  const characteristics = [
    product.brand && { label: 'Бренд', value: product.brand },
    product.country && { label: 'Страна производства', value: product.country },
    product.composition && { label: 'Состав', value: product.composition },
    product.compositionSecondary && { label: 'Доп. состав', value: product.compositionSecondary },
    product.articleNumber && { label: 'Артикул', value: product.articleNumber, mono: true },
    product.productCode && { label: 'Код товара', value: product.productCode, mono: true },
    product.modelParams && { label: 'Параметры модели', value: product.modelParams },
  ].filter((row): row is { label: string; value: string; mono?: boolean } => Boolean(row));

  return (
    <div className="relative min-h-screen bg-[#faf9f6] dark:bg-[#191926] pt-20 pb-24 transition-colors">
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {/* Breadcrumb */}
        <nav className="mb-10 flex flex-wrap items-center gap-2.5 text-sm">
          <Link
            href="/collections"
            className="group inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={15} aria-hidden className="transition-transform group-hover:-translate-x-0.5" />
            Коллекции
          </Link>
          <span className="text-gray-300 dark:text-neutral-700">/</span>
          <span className="text-gray-900 dark:text-white font-light tracking-wide truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Gallery */}
          <ProductGallery
            images={allImages.map((img) => ({
              id: img.id,
              url: img.url || getPlaceholderImage(product.id),
              mediaType: img.mediaType,
              thumbnailUrl: img.thumbnailUrl,
              duration: img.duration,
            }))}
            name={product.name}
            selectedIndex={selectedImage}
            onSelectIndex={setSelectedImage}
            isNew={product.isNew}
            featured={product.featured}
          />

          {/* Info — Editorial Luxury: чистый холст, без карточки, воздух */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <motion.div
              className="space-y-7"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45, ease: EASE }}
            >
              {/* Eyebrow: category + плоские текстовые метки (без свечения) */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                {product.categories[0] && (
                  <span className="text-gray-400 dark:text-neutral-500">
                    {product.categories.join(' · ')}
                  </span>
                )}
                {(product.isNew || product.featured) && (
                  <span className="text-gray-300 dark:text-neutral-700">·</span>
                )}
                {product.isNew && (
                  <span className="text-violet-600 dark:text-violet-400">New</span>
                )}
                {product.featured && (
                  <span className="text-gray-500 dark:text-neutral-400">Хит</span>
                )}
              </div>

              {/* Заголовок — единственный «герой» (использует фирменный display h1) */}
              <h1 className="text-[2rem] sm:text-4xl lg:text-[2.6rem] leading-[1.08] text-gray-900 dark:text-white">
                {product.name}
              </h1>

              {/* Цена — обычный уверенный вес, не градиент, + фиолетовая тонкая линия-акцент */}
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-[1.75rem] sm:text-3xl font-semibold leading-none tracking-tight tabular-nums text-gray-900 dark:text-white">
                    {price.toLocaleString('ru-RU')}&nbsp;₽
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      product.inStock
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                </div>
                <div className="mt-3 h-px w-16 pdp-accent-gradient rounded-full" />
              </div>

              <p className="text-[15px] font-light leading-relaxed text-gray-600 dark:text-neutral-300/90 max-w-md">
                {product.description || 'Премиальная вещь из курируемой коллекции ELEVATE.'}
              </p>

              {/* Цвет */}
              {colorOptions.length > 0 && (
                <ColorSelector
                  colors={colorOptions}
                  activeColorId={selectedColorId}
                  onSelect={(id) => setSelectedColorId(id)}
                />
              )}

              {/* Размеры */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">
                      Размер
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSizeAdvisorOpen(true)}
                      className="group inline-flex items-center gap-1.5 rounded-xl border border-violet-200 dark:border-neutral-700 bg-violet-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-neutral-300 transition-colors hover:bg-violet-100 hover:border-violet-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Подобрать размер
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5" role="listbox" aria-label="Выбор размера">
                    {product.sizes.map((sizeData) => {
                      const sizeLabel = sizeData.sizeName || sizeData.size_name || '';
                      const isInStock = sizeData.inStock !== undefined ? sizeData.inStock : sizeData.in_stock !== undefined ? sizeData.in_stock : true;
                      const isSelected = selectedSize === sizeLabel;

                      return (
                        <button
                          key={sizeData.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={!isInStock}
                          onClick={() => isInStock && setSelectedSize(sizeLabel)}
                          className={`relative min-w-[3.25rem] overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            !isInStock
                              ? 'border border-gray-200 bg-gray-100/60 text-gray-400 line-through cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
                              : isSelected
                                ? 'text-white'
                                : 'border border-gray-300 text-gray-800 hover:border-violet-400 hover:text-violet-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-violet-400 dark:hover:text-violet-300'
                          }`}
                        >
                          {isInStock && isSelected && (
                            <motion.span
                              layoutId="sizePill"
                              className="absolute inset-0 -z-10 pdp-accent-gradient"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            />
                          )}
                          {sizeLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
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
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-200 dark:bg-neutral-800 text-gray-500 py-3.5 px-6 text-sm cursor-not-allowed"
                  >
                    <ShoppingBag size={18} aria-hidden />
                    Нет в наличии
                  </button>
                )}
                <FavoriteButton productId={product.id} size={20} />
              </div>

              {/* Подсказка о размере — фиксированная высота, без сдвига макета */}
              {product.inStock && (
                <div className="min-h-[2.5rem]">
                  <AnimatePresence>
                    {!selectedSize && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-neutral-400"
                      >
                        <Ruler className="h-3.5 w-3.5 shrink-0" />
                        Выберите размер перед добавлением в корзину
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Trust strip — плоская спокойная строка */}
              <div className="flex items-center gap-2.5 border-t border-gray-200/80 dark:border-white/[0.06] pt-5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Оригинальный товар · Безопасная оплата · Возврат 14 дней
                </p>
              </div>

              {/* Характеристики */}
              {characteristics.length > 0 && (
                <div className="pt-1">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">
                    Характеристики
                  </h3>
                  <dl className="grid grid-cols-1">
                    {characteristics.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-baseline justify-between gap-4 border-b border-gray-200/70 dark:border-white/[0.06] py-2.5 last:border-0"
                      >
                        <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-neutral-500">
                          {row.label}
                        </dt>
                        <dd className={`text-right text-sm font-medium text-gray-900 dark:text-white ${row.mono ? 'font-mono' : ''}`}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        <motion.section
          className="mt-20 md:mt-28"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500">
                <Star className="h-3 w-3 fill-current text-violet-600 dark:text-violet-400" />
                Отзывы покупателей
              </p>
              <h2 className="text-3xl md:text-[2.5rem] leading-none text-gray-900 dark:text-white">
                Мнения клиентов
              </h2>
            </div>
            {/* Вторичная кнопка (ghost) — не конкурирует с CTA «В корзину» */}
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 dark:border-neutral-700 bg-violet-50 dark:bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-violet-700 dark:text-neutral-200 transition-colors hover:bg-violet-100 hover:border-violet-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              {showReviewForm ? 'Закрыть форму' : 'Написать отзыв'}
              {!showReviewForm && <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showReviewForm && (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-10 overflow-hidden"
              >
                <ReviewForm
                  productId={product.id}
                  onSuccess={() => setShowReviewForm(false)}
                  onCancel={() => setShowReviewForm(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <ReviewList productId={product.id} />
        </motion.section>

        {/* Complete the look */}
        {related.length > 0 && (
          <motion.section
            className="mt-20 md:mt-28"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500">
                  Стилист ELEVATE
                </p>
                <h2 className="text-3xl md:text-[2.5rem] leading-none text-gray-900 dark:text-white">
                  Дополните образ
                </h2>
              </div>
              <Link
                href="/collections"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-violet-600 dark:text-neutral-300 dark:hover:text-violet-300 transition-colors"
              >
                Вся коллекция
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
              {related.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: idx * 0.06, ease: EASE }}
                >
                  <ProductCard product={item} variant="collections" />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Size Advisor Modal */}
        <SizeAdvisorModal
          isOpen={isSizeAdvisorOpen}
          onClose={() => setIsSizeAdvisorOpen(false)}
          onSelectSize={(size) => setSelectedSize(size)}
          availableSizes={availableSizes}
        />
      </motion.div>
    </div>
  );
}
