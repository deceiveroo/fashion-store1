'use client';

import { motion } from 'framer-motion';
import { Play, Ruler, Layers } from 'lucide-react';
import ProxyImage from '@/components/ProxyImage';

type HolographicPanelProps = {
  open: boolean;
  name: string;
  description: string;
  secondaryImage?: string;
  onClose: () => void;
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function HolographicPanel({
  open,
  name,
  description,
  secondaryImage,
  onClose,
}: HolographicPanelProps) {
  if (!open) return null;

  const composition =
    description.length > 30
      ? description.slice(0, 120) + (description.length > 120 ? '…' : '')
      : '68% органический хлопок · 22% лён · 10% переработанный полиэстер';

  return (
    <motion.div
      role="dialog"
      aria-label={`Детали: ${name}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="fc-holographic-panel absolute inset-0 z-30 flex flex-col justify-end overflow-hidden p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        aria-hidden
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-40 rounded-full bg-black/30 px-2 py-1 text-[10px] text-white backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        Закрыть
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 400, damping: 30 }}
        className="relative z-10 space-y-3"
      >
        <motion.h4
          className="fc-font-variable text-sm font-medium text-gray-900 dark:text-white"
          style={{ '--fc-font-weight-dynamic': 600 } as React.CSSProperties}
        >
          {name}
        </motion.h4>

        <motion.div className="flex items-start gap-2 text-xs text-gray-700 dark:text-neutral-300">
          <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <p className="leading-relaxed">{composition}</p>
        </motion.div>

        <motion.div className="flex items-center gap-2">
          <Ruler className="h-3.5 w-3.5 text-gray-600 dark:text-neutral-400" aria-hidden />
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Размерная сетка">
            {SIZES.map((size) => (
              <span
                key={size}
                role="listitem"
                className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
              >
                {size}
              </span>
            ))}
          </div>
        </motion.div>

        {secondaryImage && (
          <motion.div
            className="relative mt-1 aspect-video overflow-hidden rounded-lg border border-white/15"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <ProxyImage src={secondaryImage} alt="" className="h-full w-full object-cover opacity-90" proxyWidth={640} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-md">
                <Play className="h-3 w-3" aria-hidden />
                Lookbook
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
