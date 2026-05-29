'use client';

import { motion } from 'framer-motion';
import { Target, Globe, Users, Award } from 'lucide-react';
import TeamSection from '@/components/TeamSection';
import { GlassCard, SectionTitle, IconBadge, EASE } from '@/components/company/PageKit';

const values = [
  {
    icon: Target,
    title: 'Миссия',
    description: 'Переосмысливать моду через инновации, создавая одежду, которая не только выглядит потрясающе, но и функциональна, устойчива и технологически продвинута.',
  },
  {
    icon: Globe,
    title: 'Устойчивость',
    description: 'Мы стремимся к нулевому воздействию на окружающую среду, используя переработанные материалы и внедряя устойчивые практики на каждом этапе производства.',
  },
  {
    icon: Users,
    title: 'Сообщество',
    description: 'Создаём глобальное сообщество новаторов, которые ценят качество, инновации и осознанное потребление.',
  },
  {
    icon: Award,
    title: 'Качество',
    description: 'Каждый предмет одежды проходит строгий контроль качества и создаётся с вниманием к деталям, чтобы служить вам долгие годы.',
  },
];

const storyStats = [
  { value: '95%', label: 'Клиентов' },
  { value: '24/7', label: 'Поддержка' },
  { value: '100%', label: 'Экологично' },
];

const floatingBadges = [
  { value: '100+', label: 'Проектов', cls: '-top-10 left-1/2 -translate-x-1/2' },
  { value: '8+', label: 'Лет опыта', cls: '-bottom-8 -left-6' },
  { value: '50+', label: 'Сотрудников', cls: '-top-8 -right-6' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* HERO — видео */}
      <section className="relative flex h-[28rem] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover" aria-hidden="true">
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>
        {/* затемнение + акцентный оттенок */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/30 to-[var(--background)]" />
        <div className="absolute inset-0 z-10 bg-[#8b7cf6]/10 mix-blend-overlay" />

        <div className="relative z-20 mx-auto max-w-4xl px-4 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#c4b5fd]" />
            О бренде ELEVATE
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="text-5xl font-bold uppercase tracking-tight md:text-7xl"
          >
            О нас
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mx-auto mt-4 max-w-2xl text-lg text-white/90 md:text-xl"
          >
            Переосмысливая будущее моды
          </motion.p>
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <SectionTitle>Наша история</SectionTitle>
            <div className="space-y-4">
              {[
                <>
                  <span className="font-bold text-[#8b7cf6]">ELEVATE</span> родился из желания изменить индустрию моды. Мы верим, что одежда должна быть не только красивой, но и умной, устойчивой и функциональной.
                </>,
                <>
                  Основанная в 2024 году, компания объединила лучших дизайнеров, инженеров и экологов для создания одежды будущего — умные ткани, биометрические датчики и устойчивые материалы.
                </>,
                <>
                  Сегодня <span className="font-bold text-[#8b7cf6]">ELEVATE</span> — это больше чем бренд одежды. Это сообщество новаторов, стремящихся сделать мир лучше через осознанную моду.
                </>,
              ].map((content, i) => (
                <div
                  key={i}
                  className="fc-glass-card border-l-2 border-l-[#8b7cf6] p-5 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                >
                  {content}
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {storyStats.map((s) => (
                <div key={s.label} className="fc-glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--foreground)]">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[var(--fc-radius-card)] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Наше производство"
                className="h-auto w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#8b7cf6]/40 to-transparent" />
            </div>

            {floatingBadges.map((b) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                whileHover={{ y: -4 }}
                className={`fc-holographic-panel absolute z-10 flex h-28 w-28 flex-col items-center justify-center rounded-2xl text-center ${b.cls}`}
              >
                <div className="text-2xl font-bold text-[var(--foreground)]">{b.value}</div>
                <div className="text-xs text-[var(--text-secondary)]">{b.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* VALUES */}
      <section className="fc-ambient-bg relative overflow-hidden py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl [background:radial-gradient(circle,rgba(139,124,246,0.18),transparent_70%)]"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <SectionTitle className="!mb-4">Наши ценности</SectionTitle>
            <p className="mx-auto max-w-2xl text-[var(--text-secondary)]">
              Принципы, которые направляют каждое наше решение и вдохновляют на инновации
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {values.map((value, i) => (
              <GlassCard key={value.title} delay={i * 0.08} className="flex items-start gap-5">
                <IconBadge icon={value.icon} size="lg" />
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--foreground)]">{value.title}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">{value.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <TeamSection />
    </div>
  );
}
