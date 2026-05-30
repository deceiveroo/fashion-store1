// components/checkout/StoreListItem.tsx
'use client';

import { motion } from 'framer-motion';
import { MapPin, Star, Navigation, Heart } from 'lucide-react';
import type { StoreItem } from '@/lib/stores/types';

const ACCENT = '#8b7cf6';
const ACCENT_TO = '#c4b5fd';

interface StoreListItemProps {
  store: StoreItem;
  active: boolean;
  favorite?: boolean;
  index?: number;
  onSelect: (store: StoreItem) => void;
  onToggleFavorite?: (store: StoreItem) => void;
}

export default function StoreListItem({
  store,
  active,
  favorite = false,
  index = 0,
  onSelect,
  onToggleFavorite,
}: StoreListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25) }}
      onClick={() => onSelect(store)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(store)}
      className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#8b7cf6]/50 ${
        active
          ? 'border-[#8b7cf6] bg-[#8b7cf6]/8 shadow-[0_0_0_1px_rgba(139,124,246,0.4),0_8px_30px_rgba(139,124,246,0.18)]'
          : 'border-gray-200/70 bg-white/60 hover:border-[#8b7cf6]/40 dark:border-gray-700/60 dark:bg-gray-800/40'
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT_TO})` }}
      />
      <div className="flex items-start justify-between gap-2">
        <h3 className="pr-1 font-bold uppercase tracking-tight text-gray-900 dark:text-white">
          {store.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(store);
              }}
              aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
              className="rounded-full p-1 text-gray-400 transition-colors hover:text-rose-500"
            >
              <Heart size={15} className={favorite ? 'fill-rose-500 text-rose-500' : ''} />
            </button>
          )}
          <span className="flex items-center gap-1 rounded-full bg-[#8b7cf6]/12 px-2 py-0.5 text-[#8b7cf6]">
            <Star size={11} fill="currentColor" />
            <span className="text-xs font-semibold">{store.rating}</span>
          </span>
        </div>
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <MapPin size={14} className="mt-0.5 shrink-0 text-[#8b7cf6]" />
        {store.address}
      </p>
      {store.distance !== undefined && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#8b7cf6]">
          <Navigation size={12} />
          {store.distance} км от вас
        </p>
      )}
    </motion.div>
  );
}
