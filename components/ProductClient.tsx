'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Star, Sparkles } from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';
import ProductCard from '@/components/product-card';
import type { ProductCardProduct } from '@/components/product-card/types';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import StarRating from '@/components/reviews/StarRating';
import SizeAdvisorModal from '@/components/SizeAdvisorModal';
import ColorSelector, { type ColorOption } from '@/components/product/ColorSelector';
import ProductGallery from '@/components/product/ProductGallery';

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
  // Новые поля
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSizeAdvisorOpen, setIsSizeAdvisorOpen] = useState(false);

  const availableSizes = useMemo(() => {
    return product.sizes?.map(s => s.sizeName || s.size_name || '').filter(Boolean) as string[] || [];
  }, [product.sizes]);

  // Цветовые варианты в стиле ЦУМ.
  // Источник правды — привязка фото к цвету (product_images.color). Собираем
  // уникальные цвета в порядке появления; превью каждого цвета — его первое фото.
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
    // Есть фото с привязкой к цвету — строим варианты из них.
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
    // Фолбэк: одно текстовое поле `product.color` (без фильтрации галереи).
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

  // Если набор цветов изменился извне — синхронизируем выбор.
  useEffect(() => {
    if (!selectedColorId && colorOptions.length > 0) {
      setSelectedColorId(colorOptions[0].id);
    }
  }, [colorOptions, selectedColorId]);

  // При смене цвета показываем первое фото нового цвета.
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColorId]);

  const price = toNumberPrice(product.price);

  const allImages = useMemo(() => {
    const valid = product.images.filter((img) => img?.url);
    if (valid.length > 0) {
      // Если фото привязаны к цветам — показываем только фото выбранного цвета.
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
          // Получаем главное изображение
          let mainImage = p.mainImage || getPlaceholderImage(p.id);
          
          // Если есть images массив, используем первое изображение
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#191926] pt-20 pb-20 transition-colors">
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

          {/* Info — sticky on desktop */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-8">
              {product.categories[0] && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-neutral-500">
                  {product.categories.join(' · ')}
                </p>
              )}

              <div>
                <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-light leading-tight tracking-tight text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                <div className="mt-4 h-px w-16 bg-gradient-to-r from-purple-500/70 to-transparent" />
              </div>

              <p className="text-2xl md:text-3xl font-light text-gray-900 dark:text-white tabular-nums">
                {price.toLocaleString('ru-RU')}&nbsp;₽
              </p>

              <p className="text-base font-light leading-relaxed text-gray-600 dark:text-neutral-400 max-w-md">
                {product.description || 'Премиальная вещь из курируемой коллекции ELEVATE.'}
              </p>

              {/* Детали товара */}
              {(product.brand || product.country || product.composition || product.color || product.articleNumber || product.modelParams) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-8 pt-8 border-t border-gray-200 dark:border-neutral-800"
                >
                  <h3 className="text-sm font-medium uppercase tracking-wider text-gray-900 dark:text-white mb-6">
                    Характеристики
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {product.brand && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Бренд</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{product.brand}</span>
                      </div>
                    )}
                    {product.country && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Страна производства</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{product.country}</span>
                      </div>
                    )}
                    {product.composition && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Состав</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{product.composition}</span>
                      </div>
                    )}
                    {product.compositionSecondary && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Дополнительный состав</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{product.compositionSecondary}</span>
                      </div>
                    )}
                    {/* Цвет вынесен в отдельный ColorSelector над блоком размеров */}
                    {product.articleNumber && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Артикул</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{product.articleNumber}</span>
                      </div>
                    )}
                    {product.productCode && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Код товара</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{product.productCode}</span>
                      </div>
                    )}
                    {product.modelParams && (
                      <div className="flex items-baseline gap-2 md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500 min-w-[140px]">Параметры модели</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{product.modelParams}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Color selector — стиль ЦУМ: превью-фото + название */}
              {colorOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.17 }}
                >
                  <ColorSelector
                    colors={colorOptions}
                    activeColorId={selectedColorId}
                    onSelect={(id) => setSelectedColorId(id)}
                  />
                </motion.div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-500">
                      Размер
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSizeAdvisorOpen(true)}
                      className="text-xs font-light tracking-wide text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-4 flex items-center gap-1.5 transition-colors focus:outline-none"
                    >
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      Подобрать размер
                    </button>
                  </div>
                  <motion.div className="flex flex-wrap gap-2" role="listbox" aria-label="Выбор размера">
                    {product.sizes.map((sizeData) => {
                      const sizeLabel = sizeData.sizeName || sizeData.size_name || '';
                      const isInStock = sizeData.inStock !== undefined ? sizeData.inStock : sizeData.in_stock !== undefined ? sizeData.in_stock : true;
                      
                      return (
                        <button
                          key={sizeData.id}
                          type="button"
                          role="option"
                          aria-selected={selectedSize === sizeLabel}
                          disabled={!isInStock}
                          onClick={() => isInStock && setSelectedSize(sizeLabel)}
                          className={`min-w-[3rem] rounded-xl px-4 py-2.5 text-sm font-light border transition-all ${
                            !isInStock
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600'
                              : selectedSize === sizeLabel
                                ? 'border-gray-900 bg-gray-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-gray-900'
                                : 'border-gray-300 text-gray-800 hover:border-gray-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-white'
                          }`}
                        >
                          {sizeLabel}
                        </button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

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
                <div className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 px-4">
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

        {/* Reviews Section */}
        <motion.section
          className="mt-20 md:mt-28 pt-16 border-t border-gray-200 dark:border-neutral-800"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-neutral-500 mb-2">
                Отзывы покупателей
              </p>
              <h2 className="text-2xl md:text-3xl font-light text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                Мнения клиентов
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </h2>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="rounded-xl border border-gray-900 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900"
            >
              {showReviewForm ? 'Закрыть форму' : 'Написать отзыв'}
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
            className="mt-20 md:mt-28 pt-16 border-t border-gray-200 dark:border-neutral-800"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <motion.div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400 dark:text-neutral-500 mb-2">
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
