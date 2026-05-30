'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { LucideIcon, ArrowUp } from 'lucide-react';

/**
 * Общий «кит» для юридических страниц (/terms, /privacy, /cookies).
 * Единый стеклянный стиль сайта (fc-glass): прогресс-бар чтения, оглавление
 * с подсветкой активной секции, плавный скролл по якорям и кнопка «наверх».
 */

// Обёртка страницы: амбиентный фон + прогресс-бар чтения + кнопка «наверх».
export function LegalShell({ children }: { children: ReactNode }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--background)] pb-24 pt-24">
      {/* Прогресс чтения */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-[#8b7cf6] to-[#c4b5fd]"
      />
      {/* Амбиентное свечение акцента */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[#8b7cf6]/10 blur-[120px]" />
      </div>

      {children}

      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)', boxShadow: '0 12px 28px -8px rgba(139,124,246,0.7)' }}
          aria-label="Наверх"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </div>
  );
}

// Шапка: градиентная иконка-плитка, заголовок, дата обновления, вступление.
export function LegalHero({
  icon: Icon,
  title,
  updated,
  intro,
}: {
  icon: LucideIcon;
  title: string;
  updated: string;
  intro?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-12 max-w-3xl px-4 text-center sm:px-6"
    >
      <div
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl text-white"
        style={{ backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)', boxShadow: '0 16px 40px -12px rgba(139,124,246,0.6)' }}
      >
        <Icon size={38} />
      </div>
      <h1 className="text-4xl font-bold uppercase tracking-tight text-[var(--foreground)] md:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">Последнее обновление: {updated}</p>
      {intro && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">{intro}</p>}
    </motion.header>
  );
}

// Двухколоночная раскладка: липкое оглавление (десктоп) + контент.
export function LegalLayout({ toc, children }: { toc: { id: string; title: string }[]; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
      <LegalToc items={toc} />
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}

function LegalToc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <aside className="hidden lg:block">
      <nav className="fc-glass-card sticky top-24 p-4">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Содержание</p>
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => go(it.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === it.id
                    ? 'bg-[rgba(139,124,246,0.14)] font-semibold text-[#8b7cf6]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {it.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// Стеклянная секция с якорем, иконкой и заголовком.
export function LegalSection({
  id,
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      className="fc-glass-card scroll-mt-24 p-6 md:p-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#8b7cf6]"
          style={{ background: 'rgba(139,124,246,0.14)' }}
        >
          <Icon size={22} />
        </span>
        <h2 className="text-xl font-bold uppercase tracking-tight text-[var(--foreground)] md:text-2xl">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

// Маркированный список с акцентными точками.
export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7cf6]" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
