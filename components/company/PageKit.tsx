'use client';

/* ─────────────────────────────────────────────────────────────
   PageKit — единый набор примитивов для статичных страниц
   (company/* и support/*). Строится на --fc-* дизайн-системе:
   glassmorphism, noise, Oswald-капс, акцент-фиолет, dark-mode и
   уважение к prefers-reduced-motion. Один стиль на все страницы.
   ──────────────────────────────────────────────────────────── */

import {
  type ReactNode,
  type ComponentType,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

/* Акцент страницы: фиолет (по умолчанию) или изумруд (sustainability). */
export type Accent = 'violet' | 'emerald';

type AccentTokens = {
  rgb: string; // "r g b" для rgb(... / a)
  text: string; // tailwind text-color класс для иконок/чисел
  from: string; // hex для градиента
  to: string;
};

const ACCENTS: Record<Accent, AccentTokens> = {
  violet: { rgb: '139 124 246', text: 'text-[#8b7cf6]', from: '#8b7cf6', to: '#c4b5fd' },
  emerald: { rgb: '16 185 129', text: 'text-emerald-500', from: '#10b981', to: '#6ee7b7' },
};

/* Общая spring/ease-кривая бренда. */
const EASE = [0.22, 1, 0.36, 1] as const;

/* Тонкая noise-текстура (inline data-URI, без сетевого запроса). */
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* ─── PageShell: ambient-фон + noise + мягкие световые пятна ─── */
export function PageShell({
  children,
  accent = 'violet',
  className = '',
}: {
  children: ReactNode;
  accent?: Accent;
  className?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`fc-ambient-bg relative min-h-screen overflow-hidden pb-24 pt-28 ${className}`}>
      {/* noise-слой поверх фона */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay dark:opacity-[0.07]"
        style={{ backgroundImage: NOISE_URI, backgroundSize: '160px 160px' }}
      />
      {/* световые пятна акцентного цвета */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, rgb(${a.rgb} / 0.22), transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-[-10%] h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, rgb(${a.rgb} / 0.14), transparent 70%)` }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

/* ─── PageHeader: чип + Oswald-капс заголовок с градиентом ─── */
export function PageHeader({
  eyebrow,
  title,
  highlight,
  description,
  accent = 'violet',
  align = 'center',
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  accent?: Accent;
  align?: 'center' | 'left';
  icon?: LucideIcon;
}) {
  const a = ACCENTS[accent];
  const centered = align === 'center';
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`mb-16 ${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}`}
    >
      <span
        className={`inline-flex items-center gap-2 rounded-full border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] backdrop-blur-md ${
          centered ? 'mx-auto' : ''
        }`}
    >
      {Icon ? <Icon size={14} className={a.text} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.from }} />}
        {eyebrow}
      </span>
      <h1 className="mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-6xl">
        {title}
        {highlight ? (
          <>
            {' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${a.from}, ${a.to})` }}
            >
              {highlight}
            </span>
          </>
        ) : null}
      </h1>
      <p className={`mt-4 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg ${centered ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>
        {description}
      </p>
    </motion.header>
  );
}

/* ─── GlassCard: базовая стеклянная карточка с опц. 3D-tilt ─── */
export function GlassCard({
  children,
  className = '',
  tilt = false,
  delay = 0,
  hoverLift = true,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  delay?: number;
  hoverLift?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cfg = { stiffness: 220, damping: 20, mass: 0.4 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], ['6deg', '-6deg']), cfg);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], ['-6deg', '6deg']), cfg);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || !tilt || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function reset() {
    mx.set(0);
    my.set(0);
  }

  const style: MotionStyle = tilt && !reduce ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : {};

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      whileHover={hoverLift && !reduce ? { y: -6 } : undefined}
      style={style}
      className={`fc-glass-card relative p-6 sm:p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── StatGrid: ряд из 4 показателей в стекле ─── */
export function StatGrid({
  stats,
  accent = 'violet',
}: {
  stats: { value: string; label: string; icon: LucideIcon }[];
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
          className="fc-glass-card flex flex-col items-center gap-2 p-6 text-center"
        >
          <s.icon className={a.text} size={26} />
          <span className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {s.value}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {s.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── SectionTitle: подзаголовок секции в Oswald-капсе ─── */
export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`mb-10 text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] sm:text-4xl ${className}`}
    >
      {children}
    </motion.h2>
  );
}

/* ─── IconBadge: квадратный значок с акцентным градиентом ─── */
export function IconBadge({
  icon: Icon,
  accent = 'violet',
  size = 'md',
}: {
  icon: LucideIcon;
  accent?: Accent;
  size?: 'md' | 'lg';
}) {
  const a = ACCENTS[accent];
  const dim = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const ic = size === 'lg' ? 28 : 22;
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-2xl text-white shadow-lg`}
      style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
    >
      <Icon size={ic} />
    </div>
  );
}

/* ─── MagneticButton: кнопка с магнитным эффектом ─── */
export function MagneticButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  accent = 'violet',
  variant = 'solid',
  href,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  accent?: Accent;
  variant?: 'solid' | 'outline';
  href?: string;
  className?: string;
}) {
  const a = ACCENTS[accent];
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 300, damping: 20 });
  const yy = useSpring(my, { stiffness: 300, damping: 20 });

  function onMove(e: PointerEvent<HTMLElement>) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width / 2) * 0.3);
    my.set((e.clientY - r.top - r.height / 2) * 0.3);
  }
  function reset() {
    mx.set(0);
    my.set(0);
  }

  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold uppercase tracking-wide transition-shadow disabled:cursor-not-allowed disabled:opacity-60';
  const solid = 'text-white shadow-lg hover:shadow-xl';
  const outline =
    'border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] text-[var(--foreground)] backdrop-blur-md hover:shadow-lg';

  const inner = (
    <motion.span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={
        variant === 'solid'
          ? { x, y: yy, backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})` }
          : { x, y: yy }
      }
      className={`${base} ${variant === 'solid' ? solid : outline} ${className}`}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block bg-transparent p-0">
      {inner}
    </button>
  );
}

/* ─── CTABand: финальный акцентный блок-призыв ─── */
export function CTABand({
  icon: Icon,
  title,
  description,
  accent = 'violet',
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  accent?: Accent;
  children: ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: EASE }}
      className="relative mt-16 overflow-hidden rounded-[var(--fc-radius-card)] p-10 text-center text-white sm:p-14"
      style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
    >
      {/* декоративные кольца */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/15" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border border-white/15" />
      {/* noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{ backgroundImage: NOISE_URI, backgroundSize: '160px 160px' }}
      />
      <div className="relative z-10">
        {Icon ? <Icon size={44} className="mx-auto mb-5 text-white/90" /> : null}
        <h2 className="mb-4 text-3xl font-bold uppercase tracking-tight sm:text-4xl">{title}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-base text-white/85 sm:text-lg">{description}</p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">{children}</div>
      </div>
    </motion.section>
  );
}

/* ─── Pill: фильтр-таб / переключатель ─── */
export function Pill({
  active,
  onClick,
  children,
  accent = 'violet',
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-medium uppercase tracking-wide transition-all ${
        active
          ? 'text-white shadow-lg'
          : 'border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] text-[var(--text-secondary)] backdrop-blur-md hover:text-[var(--foreground)]'
      }`}
      style={active ? { backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})` } : undefined}
    >
      {children}
    </button>
  );
}

export { ACCENTS, EASE };
