'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ShieldCheck, Truck, Heart } from 'lucide-react';

/**
 * Брендовая split-screen панель для auth (модалка/страницы).
 * Анимированный «aurora» из мягких градиентных пятен на бренд-цвете — без WebGL,
 * стабильно гладко. Скрывается на мобильных родителем (hidden md:flex).
 */
const FEATURES = [
  { icon: Sparkles, text: 'Курируемые коллекции и новинки сезона' },
  { icon: Truck, text: 'Бесплатная доставка от 5000 ₽' },
  { icon: Heart, text: 'Избранное, история и персональные подборки' },
  { icon: ShieldCheck, text: 'Двухфакторная защита аккаунта' },
];

export default function AuthPanel() {
  const reduce = useReducedMotion();

  return (
    <div className="relative hidden overflow-hidden md:flex md:w-1/2 md:flex-col md:justify-between md:p-10 text-white">
      {/* Базовый градиент бренда */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(140deg, #6d28d9 0%, #8b7cf6 45%, #c4b5fd 100%)' }} />

      {/* Анимированные световые пятна (aurora) */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.55), transparent 70%)' }}
            animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55), transparent 70%)' }}
            animate={{ x: [0, -30, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)' }}
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Контент */}
      <div className="relative z-10">
        <span className="text-2xl font-black uppercase tracking-[0.3em]">ELEVATE</span>
      </div>

      <div className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm text-4xl font-bold uppercase leading-[1.05] tracking-tight"
        >
          Мода, которая
          <br /> работает на вас
        </motion.h2>
        <p className="mt-4 max-w-xs text-sm text-white/80">
          Войдите, чтобы открыть избранное, отслеживать заказы и получать персональные рекомендации.
        </p>
      </div>

      <ul className="relative z-10 space-y-3">
        {FEATURES.map((f, i) => (
          <motion.li
            key={f.text}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 text-sm text-white/90"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <f.icon size={16} />
            </span>
            {f.text}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
