'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import FavoriteButton from '@/components/FavoriteButton';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
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
  const { addItem } = useCart();
  const router = useRouter();
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

  const cartPayload = {
    id: product.id,
    name: product.name,
    price: currentPrice,
    image: primaryImage,
  };

  return (
    <article
      className="group/card"
      onMouseEnter={() => {
        setHovered(true);
        router.prefetch(`/products/${product.id}`);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/products/${product.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
        aria-label={`${product.name}, ${currentPrice.toLocaleString('ru-RU')} ₽`}
      >
        <motion.div
          className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        >
          {/* Primary */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${hovered && showHoverImage ? 'scale-105 opacity-0' : 'scale-100 opacity-100'}`}
          />

          {/* Hover image */}
          {showHoverImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={hoverImage}
              alt=""
              aria-hidden
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
                hovered ? 'scale-105 opacity-100' : 'scale-100 opacity-0'
              }`}
            />
          )}

          {!imageLoaded && (
            <motion.div
              className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}

          {/* Soft vignette on hover */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          />

          {/* Badges */}
          <motion.div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {showNew && (
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                New
              </span>
            )}
            {product.featured && !showNew && (
              <span className="bg-gray-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white dark:bg-white dark:text-gray-900">
                Хит
              </span>
            )}
            {!currentStock && (
              <span className="bg-white/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-900 backdrop-blur-sm">
                Sold out
              </span>
            )}
          </motion.div>

          {/* Favorite */}
          <motion.div
            className="absolute top-3 right-3 z-10"
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -4 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton productId={product.id} />
          </motion.div>

          {/* Bottom CTA strip - always visible on mobile, hover on desktop */}
          <motion.div
            className="absolute inset-x-0 bottom-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:opacity-0 sm:pointer-events-none"
            initial={false}
            animate={{ opacity: hovered ? 1 : 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <Link
              href={`/products/${product.id}`}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white rounded-xl shadow-lg active:scale-95 transition-transform border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              Смотреть
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            {currentStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addItem(cartPayload);
                  toast.success(`${product.name} в корзине`);
                }}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white rounded-xl shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden />
                В корзину
              </button>
            )}
          </motion.div>
        </motion.div>

        <div className="mt-4 space-y-1.5">
          {variant === 'collections' && product.categories[0] && (
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
              {product.categories[0]}
            </p>
          )}
          <h3 className="text-sm font-light tracking-wide text-gray-900 transition-colors group-hover/card:text-purple-700 dark:text-white dark:group-hover/card:text-purple-300 line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {currentPrice.toLocaleString('ru-RU')}&nbsp;₽
            </p>
            {variant === 'men' || variant === 'women' ? (
              <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                {variant === 'men' ? 'Men' : 'Women'}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
