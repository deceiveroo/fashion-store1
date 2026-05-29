'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import FavoriteButton from '@/components/FavoriteButton';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';
import type { ProductCardProps } from './types';

const getPlaceholderImage = (productId: string): string => {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return `https://picsum.photos/seed/${Math.abs(hash) % 10000}/600/750`;
};

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [currentStock, setCurrentStock] = useState(product.inStock);

  const primaryImage = useMemo(() => {
    if (product.mainImage?.trim() && product.mainImage !== '/placeholder-image.jpg') {
      return product.mainImage;
    }
    return getPlaceholderImage(product.id);
  }, [product.id, product.mainImage]);

  const hoverImage = useMemo(() => {
    const alt = product.images?.find((img) => !img.isMain && img.url !== primaryImage);
    return alt?.url ?? product.images?.[1]?.url;
  }, [product.images, primaryImage]);

  const showNew = product.isNew || variant === 'new';
  const showHoverImage = Boolean(hoverImage && hoverImage !== primaryImage);

  useEffect(() => {
    const channel = supabase
      .channel(`product-${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`,
        },
        (payload) => {
          const next = payload.new as { price?: number; stock?: number };
          if (next.price !== undefined) setCurrentPrice(next.price);
          if (next.stock !== undefined) setCurrentStock(next.stock > 0);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  const hasRating = Boolean(product.reviewCount);

  return (
    <article
      className="group/card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/products/${product.id}`}
        className="block focus-visible:outline-none"
        aria-label={`${product.name}, ${currentPrice.toLocaleString('ru-RU')} ₽`}
      >
        {/* Image frame */}
        <motion.div
          className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05] transition-shadow duration-500 group-hover/card:shadow-[0_20px_45px_-15px_rgba(157,78,221,0.35)] dark:bg-neutral-900 dark:ring-white/[0.07] group-focus-visible/card:ring-2 group-focus-visible/card:ring-purple-500"
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          {/* Primary */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
            loading="lazy"
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onLoadingComplete={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            className={`object-cover transition-all duration-[850ms] ease-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${hovered && showHoverImage ? 'scale-[1.04] opacity-0' : 'scale-100'} ${
              hovered && !showHoverImage ? 'scale-[1.06]' : ''
            }`}
          />

          {/* Hover image */}
          {showHoverImage && hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              quality={90}
              className={`object-cover transition-all duration-[850ms] ease-out ${
                hovered ? 'scale-[1.04] opacity-100' : 'scale-100 opacity-0'
              }`}
            />
          )}

          {/* Loading shimmer */}
          {!imageLoaded && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {showNew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-900 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md dark:bg-black/40 dark:text-white dark:ring-white/10">
                <Sparkles className="h-2.5 w-2.5 text-purple-500" />
                New
              </span>
            )}
            {product.featured && !showNew && (
              <span className="rounded-full bg-gray-900/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur-md dark:bg-white/90 dark:text-gray-900">
                Хит
              </span>
            )}
            {!currentStock && (
              <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-700 shadow-sm backdrop-blur-md dark:bg-neutral-800/90 dark:text-neutral-300">
                Нет в наличии
              </span>
            )}
          </div>

          {/* Favorite */}
          <motion.div
            className="absolute top-3 right-3 z-10"
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.85 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton productId={product.id} />
          </motion.div>

        </motion.div>

        {/* Meta */}
        <div className="mt-3.5 space-y-1.5">
          {variant === 'collections' && product.categories?.[0] && (
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400 dark:text-neutral-500">
              {product.categories[0]}
            </p>
          )}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[13px] font-normal leading-snug tracking-wide text-gray-900 transition-colors group-hover/card:text-purple-700 dark:text-neutral-100 dark:group-hover/card:text-purple-300 line-clamp-2">
              {product.name}
            </h3>
            {(variant === 'men' || variant === 'women') && (
              <span className="mt-0.5 shrink-0 text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                {variant === 'men' ? 'Men' : 'Women'}
              </span>
            )}
          </div>

          {hasRating && (
            <div
              className="flex items-center gap-1.5"
              aria-label={`Рейтинг ${product.rating?.toFixed(1)} из 5`}
            >
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-medium text-gray-700 dark:text-neutral-300">
                {(product.rating ?? 0).toFixed(1)}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-neutral-500">
                · {product.reviewCount} {product.reviewCount === 1 ? 'отзыв' : (product.reviewCount ?? 0) < 5 ? 'отзыва' : 'отзывов'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-0.5">
            <p className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums">
              {currentPrice.toLocaleString('ru-RU')}&nbsp;₽
            </p>
            <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-purple-500 dark:text-neutral-600" />
          </div>
        </div>
      </Link>
    </article>
  );
}
