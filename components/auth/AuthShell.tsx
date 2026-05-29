'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AuthForm from './AuthForm';
import AuthPanel from './AuthPanel';
import type { AuthMode } from '@/context/AuthModalContext';

/**
 * Оболочка для страниц /auth/*. Тот же split-screen, что и в модалке, но на
 * полноэкранном брендовом фоне (fc-ambient-bg). Режим переключается на месте
 * с анимацией — без перезагрузки страницы.
 */
export default function AuthShell({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="fc-ambient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      {/* Световые пятна как в PageShell */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(139 124 246 / 0.22), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[-10%] h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(139 124 246 / 0.14), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-[var(--fc-radius-card)] border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] shadow-2xl backdrop-blur-2xl"
      >
        <AuthPanel />
        <div className="w-full p-7 sm:p-10 md:w-1/2">
          <AuthForm mode={mode} onModeChange={setMode} context="page" />
        </div>
      </motion.div>
    </div>
  );
}
