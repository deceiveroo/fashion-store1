'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { StylistPeer } from '@/workers/stylist.worker';

type StylistCarouselProps = {
  items: StylistPeer[];
  loading: boolean;
};

export default function StylistCarousel({ items, loading }: StylistCarouselProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-3 flex gap-2 overflow-x-auto pb-1"
        aria-busy="true"
        aria-label="Подбор образа загружается"
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-12 w-12 shrink-0 rounded-full bg-white/20 animate-pulse"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    );
  }

  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="mt-3"
      role="region"
      aria-label="Комплементарные товары"
    >
      <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-400">
        Образ
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 catalog-scrollbar">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 26,
              delay: index * 0.05,
            }}
          >
            <Link
              href={`/products/${item.id}`}
              onClick={(e) => e.stopPropagation()}
              className="group/bubble flex shrink-0 flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fc-accent)]"
              title={item.name}
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/40 shadow-lg ring-2 ring-[var(--fc-accent)]/30 transition-transform duration-300 group-hover/bubble:scale-110">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.mainImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="max-w-[52px] truncate text-[9px] text-gray-600 dark:text-neutral-400">
                {item.price.toLocaleString('ru-RU')} ₽
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
