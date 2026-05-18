'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ecoLevelColors, getEcoMetrics, type EcoLevel } from '@/lib/product-card/eco-score';

type EcoAuraIndicatorProps = {
  productId: string;
  description: string;
};

export default function EcoAuraIndicator({ productId, description }: EcoAuraIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const metrics = getEcoMetrics(productId, description);
  const color = ecoLevelColors[metrics.level];

  const labels: Record<EcoLevel, string> = {
    good: 'Этично',
    neutral: 'Нейтрально',
    attention: 'Улучшить',
  };

  return (
    <motion.div
      className="absolute bottom-3 left-3 z-20"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <button
        type="button"
        aria-label={`Эко-рейтинг: ${labels[metrics.level]}, углеродный след ${metrics.carbonKg} кг`}
        aria-expanded={expanded}
        className="fc-eco-aura relative flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/20 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fc-accent)]"
        style={{
          boxShadow: `0 0 12px ${color}, inset 0 0 8px ${color}40`,
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fc-holographic-panel absolute bottom-9 left-0 z-30 w-44 rounded-xl p-3 text-left"
            role="tooltip"
          >
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-600 dark:text-neutral-300">
              {labels[metrics.level]}
            </p>
            <svg viewBox="0 0 120 48" className="mb-2 h-10 w-full" aria-hidden>
              <rect x="0" y="20" width="36" height={28 * (metrics.ethicalScore / 100)} fill={color} rx="2" />
              <rect x="42" y="12" width="36" height={36 * (1 - metrics.carbonKg / 10)} fill={color} opacity="0.6" rx="2" />
              <rect x="84" y="8" width="36" height="40" fill={color} opacity="0.35" rx="2" />
            </svg>
            <p className="text-[10px] text-gray-700 dark:text-neutral-300">
              CO₂ ≈ {metrics.carbonKg} кг
            </p>
            <p className="text-[10px] text-gray-500 dark:text-neutral-400">
              Этика {metrics.ethicalScore}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
