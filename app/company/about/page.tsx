'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Users, Zap, Globe, Star, TrendingUp, Building2, ArrowRight, Shield, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';
import TeamSection from '@/components/TeamSection';
import { GlassCard, SectionTitle, IconBadge, CTABand, MagneticButton, EASE } from '@/components/company/PageKit';

function CountUp({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}</span>;
}

const stats = [
  { number: 100, suffix: 'K+', label: 'Клиентов', icon: Users },
  { number: 7, suffix: '+', label: 'Лет опыта', icon: TrendingUp },
  { number: 98, suffix: '%', label: 'Довольных', icon: Star },
  { number: 500, suffix: '+', label: 'Партнёров', icon: Building2 },
];

const values = [
  { icon: Shield, title: 'Экологичность', desc: 'Только переработанные и биоразлагаемые материалы' },
  { icon: Zap, title: 'Инновации', desc: 'Передовые технологии в каждом изделии' },
  { icon: Heart, title: 'Качество', desc: 'Строгий контроль и любовь к деталям' },
  { icon: Globe, title: 'Сообщество', desc: 'Глобальная сеть единомышленников' },
];

const timeline = [
  { year: '2015', title: 'Основание', desc: 'Начало пути с миссией создавать устойчивую моду' },
  { year: '2017', title: 'Первая коллекция', desc: 'Выпуск коллекции из переработанных материалов' },
  { year: '2020', title: 'Признание', desc: 'Международные награды за инновации' },
  { year: '2022', title: 'AI-прорыв', desc: 'Внедрение искусственного интеллекта в производство' },
  { year: '2023', title: 'Экспансия', desc: '25 магазинов в 10 странах мира' },
  { year: '2024', title: 'Будущее', desc: 'Новая эра устойчивой роскоши' },
];

export default function AboutPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)]">

      {/* HERO — fullscreen с параллаксом */}
      <section ref={heroRef} className="fc-ambient-bg relative flex h-screen items-center justify-center overflow-hidden">
        {/* noise */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay dark:opacity-[0.08]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")", backgroundSize: '160px 160px' }}
        />

        {/* Big decorative letters */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
        >
          <span className="text-[30vw] font-black leading-none tracking-tighter text-[#8b7cf6]/10 dark:text-[#8b7cf6]/[0.07]">
            EL
          </span>
        </motion.div>

        {/* Floating orbs (акцентные) */}
        {[
          { size: 400, x: '10%', y: '20%', dur: 8 },
          { size: 300, x: '70%', y: '60%', dur: 12 },
          { size: 200, x: '50%', y: '10%', dur: 10 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#8b7cf6]/20 blur-3xl"
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8b7cf6]" />
              О компании ELEVATE
            </span>
            <h1 className="mb-8 text-6xl font-bold uppercase leading-[0.9] tracking-tight text-[var(--foreground)] md:text-8xl lg:text-9xl">
              Мода{' '}
              <span className="bg-gradient-to-r from-[#8b7cf6] to-[#c4b5fd] bg-clip-text text-transparent">
                будущего
              </span>
              <br />сегодня
            </h1>
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-[var(--text-secondary)] md:text-2xl">
              Переосмысливаем роскошь через инновации, устойчивость и страсть к совершенству
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-12 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-[var(--text-secondary)] p-1"
            >
              <div className="h-3 w-1 rounded-full bg-[var(--text-secondary)]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS — стеклянная полоса */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
              className="fc-glass-card flex flex-col items-center gap-2 p-6 text-center"
            >
              <stat.icon className="text-[#8b7cf6]" size={26} />
              <div className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
                <CountUp end={stat.number} />{stat.suffix}
              </div>
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MISSION — большой текст */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
          >
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-[#8b7cf6]">Наша миссия</p>
            <h2 className="text-4xl font-bold uppercase leading-tight tracking-tight text-[var(--foreground)] md:text-6xl">
              Мы верим, что{' '}
              <span className="bg-gradient-to-r from-[#8b7cf6] to-[#c4b5fd] bg-clip-text text-transparent">
                стиль и ответственность
              </span>{' '}
              не противоречат друг другу — они дополняют.
            </h2>
          </motion.div>
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionTitle className="text-center">Наши ценности</SectionTitle>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <GlassCard key={v.title} tilt delay={i * 0.08}>
              <IconBadge icon={v.icon} />
              <h3 className="mt-5 text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{v.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* TIMELINE — горизонтальный скролл */}
      <section className="overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTitle className="text-center">Наша история</SectionTitle>
        </div>
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-8 pb-8">
          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, ease: EASE }}
              className="w-72 flex-shrink-0 snap-start"
            >
              <div className="fc-glass-card h-full p-8">
                <div className="mb-4 text-6xl font-black leading-none text-[#8b7cf6]/25">{item.year}</div>
                <h3 className="mb-3 text-xl font-bold uppercase tracking-tight text-[var(--foreground)]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <TeamSection />

      {/* CTA */}
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <CTABand
          title="Готовы стать частью ELEVATE?"
          description="Присоединяйтесь к сообществу, которое формирует будущее моды."
        >
          <MagneticButton href="/products" variant="outline" className="!bg-white !text-gray-900">
            Смотреть коллекции
            <ArrowRight size={16} />
          </MagneticButton>
          <Link
            href="/company/stores"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/80 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-gray-900"
          >
            <MapPin size={16} />
            Найти магазин
          </Link>
        </CTABand>
      </div>
    </div>
  );
}
