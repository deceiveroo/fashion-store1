'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuthModal } from '@/context/AuthModalContext';
import AuthForm from './AuthForm';
import AuthPanel from './AuthPanel';

/**
 * Глобальная модалка авторизации. Монтируется один раз в layout, управляется
 * AuthModalContext. Split-screen на десктопе (панель + форма), только форма на мобильных.
 */
export default function AuthModal() {
  const { isOpen, mode, setMode, close } = useAuthModal();

  // ESC + блокировка скролла фона.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Карточка */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-[var(--fc-radius-card)] border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] shadow-2xl backdrop-blur-2xl"
          >
            <AuthPanel />

            <div className="relative w-full p-7 sm:p-9 md:w-1/2">
              <button
                onClick={close}
                aria-label="Закрыть"
                className="absolute right-4 top-4 rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--fc-surface-elevated)] hover:text-[var(--foreground)]"
              >
                <X size={20} />
              </button>
              <AuthForm mode={mode} onModeChange={setMode} context="modal" onSuccess={close} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
