'use client';

import { useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from 'framer-motion';
import { Quote } from 'lucide-react';

/* ─── Данные команды ─────────────────────────────────────────────
   Должности-плейсхолдеры можно поправить под фактические роли. */
type Member = {
  id: string;
  name: string;
  role: string;
  image: string;
  quote: string;
  skills: string[];
  featured?: boolean;
};

const TEAM: Member[] = [
  {
    id: 'nikita',
    name: 'Никита Ахтеркин',
    role: 'Основатель / CEO',
    image: '/images/team/nikita-akhterkin.jpg',
    quote: 'Рост — это дисциплина, а не удача.',
    skills: ['Стратегия', 'Развитие', 'Видение'],
    featured: true,
  },
  {
    id: 'kirill',
    name: 'Кирилл Афанасьев',
    role: 'Директор по развитию',
    image: '/images/team/kirill-afanasev.jpg',
    quote: 'Мода — это технология, которую носишь на себе.',
    skills: ['Бренд', 'Партнёрства', 'Аналитика'],
  },
  {
    id: 'vadim',
    name: 'Вадим Петров',
    role: 'CTO / Head of Product',
    image: '/images/team/vadim-petrov.jpg',
    quote: 'Лучший интерфейс — тот, которого не замечаешь.',
    skills: ['Архитектура', 'Frontend', 'AI'],
  },
];

/* Тонкая noise-текстура поверх фото (SVG → data-URI, без сетевого запроса). */
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ─── Карточка с 3D-наклоном ─────────────────────────────────── */
function TeamCard({ member, index }: { member: Member; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // Положение курсора внутри карточки → наклон (-0.5..0.5)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springCfg = { stiffness: 220, damping: 20, mass: 0.4 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], ['7deg', '-7deg']), springCfg);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], ['-9deg', '9deg']), springCfg);
  // Параллакс-сдвиг внутренних слоёв вслед за наклоном
  const layerX = useSpring(useTransform(mx, [-0.5, 0.5], ['-14px', '14px']), springCfg);
  const layerY = useSpring(useTransform(my, [-0.5, 0.5], ['-10px', '10px']), springCfg);

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function reset() {
    mx.set(0);
    my.set(0);
    setHovered(false);
  }

  const tiltStyle: MotionStyle = reduce
    ? {}
    : { rotateX, rotateY, transformStyle: 'preserve-3d' };
  const layerStyle: MotionStyle = reduce ? {} : { x: layerX, y: layerY };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className={member.featured ? 'lg:col-span-2 lg:row-span-2' : 'lg:col-span-1'}
      style={{ perspective: 1000 }}
    >
      <motion.article
        ref={ref}
        onPointerMove={handleMove}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={reset}
        style={tiltStyle}
        className={[
          'group fc-glass-card relative h-full w-full overflow-hidden',
          'cursor-pointer select-none',
          member.featured ? 'min-h-[460px] lg:min-h-[620px]' : 'min-h-[300px]',
        ].join(' ')}
      >
        {/* Фото / fallback */}
        <div className="absolute inset-0">
          {imgFailed ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a22] via-[#2a2436] to-[#0f0f18]">
              <span className="font-[var(--font-oswald)] text-6xl font-bold tracking-tight text-white/15">
                {initials(member.name)}
              </span>
            </div>
          ) : (
            <Image
              src={member.image}
              alt={member.name}
              fill
              sizes={member.featured ? '(max-width:1024px) 100vw, 50vw' : '(max-width:1024px) 100vw, 25vw'}
              onError={() => setImgFailed(true)}
              className="object-cover object-center grayscale transition-[filter,transform] duration-700 ease-out will-change-transform group-hover:scale-[1.04] group-hover:grayscale-0"
              priority={member.featured}
            />
          )}
          {/* noise-фильтр поверх — тает при наведении */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-60 transition-opacity duration-700 group-hover:opacity-0"
            style={{ backgroundImage: NOISE_URI, backgroundSize: '160px 160px' }}
          />
          {/* затемнение снизу для читабельности текста */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          {/* фиолетовый glow-акцент при наведении */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(120%_80%_at_50%_120%,rgba(139,124,246,0.35),transparent_60%)]" />
        </div>

        {/* Цитата — выезжает сверху при наведении (приподнятый слой) */}
        <motion.div
          style={layerStyle}
          className="absolute inset-x-5 top-5 z-20"
        >
          <motion.div
            initial={false}
            animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fc-holographic-panel inline-flex max-w-full items-start gap-2 rounded-2xl px-3.5 py-2.5"
          >
            <Quote size={16} className="mt-0.5 shrink-0 text-[#a78bfa]" />
            <p className="text-sm font-medium leading-snug text-white">
              {member.quote}
            </p>
          </motion.div>
        </motion.div>

        {/* Нижний блок: имя, роль, навыки (приподнятый слой для параллакса) */}
        <motion.div
          style={layerStyle}
          className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6"
        >
          <h3 className="mb-1 text-2xl font-bold uppercase tracking-tight text-white drop-shadow-sm sm:text-3xl">
            {member.name}
          </h3>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#c4b5fd]">
            {member.role}
          </p>

          {/* Анимированные бейджи навыков */}
          <div className="mt-3 flex flex-wrap gap-2">
            {member.skills.map((skill, i) => (
              <motion.span
                key={skill}
                initial={false}
                animate={
                  hovered
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 10, scale: 0.9 }
                }
                transition={{
                  duration: 0.35,
                  delay: hovered ? 0.08 + i * 0.07 : 0,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* тонкая рамка-блик по краю стекла */}
        <div className="pointer-events-none absolute inset-0 rounded-[var(--fc-radius-card)] ring-1 ring-inset ring-white/10" />
      </motion.article>
    </motion.div>
  );
}

/* ─── Секция ──────────────────────────────────────────────────── */
export default function TeamSection() {
  return (
    <section className="fc-ambient-bg relative overflow-hidden py-24 sm:py-32">
      {/* мягкие световые пятна на фоне */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-50 blur-3xl [background:radial-gradient(circle,rgba(139,124,246,0.22),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8b7cf6]" />
            Команда
          </span>
          <h2 className="mt-5 text-4xl font-bold uppercase leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-6xl">
            Люди за{' '}
            <span className="bg-gradient-to-r from-[#8b7cf6] to-[#c4b5fd] bg-clip-text text-transparent">
              ELEVATE
            </span>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Наведите курсор на карточку — фото оживает, появляются навыки и принцип, которым руководствуется человек.
          </p>
        </motion.div>

        {/* Bento-сетка: CEO крупно слева, остальные стопкой справа */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-2">
          {TEAM.map((member, i) => (
            <TeamCard key={member.id} member={member} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
