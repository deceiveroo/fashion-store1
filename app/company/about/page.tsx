'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Users, Award, Zap, Globe, Star, TrendingUp, Building2, ArrowRight, Shield, Heart } from 'lucide-react';
import Link from 'next/link';

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
  { icon: Shield, title: 'Экологичность', desc: 'Только переработанные и биоразлагаемые материалы', color: 'from-emerald-400 to-teal-500' },
  { icon: Zap, title: 'Инновации', desc: 'Передовые технологии в каждом изделии', color: 'from-purple-500 to-violet-600' },
  { icon: Heart, title: 'Качество', desc: 'Строгий контроль и любовь к деталям', color: 'from-pink-500 to-rose-600' },
  { icon: Globe, title: 'Сообщество', desc: 'Глобальная сеть единомышленников', color: 'from-blue-500 to-indigo-600' },
];

const timeline = [
  { year: '2015', title: 'Основание', desc: 'Начало пути с миссией создавать устойчивую моду' },
  { year: '2017', title: 'Первая коллекция', desc: 'Выпуск коллекции из переработанных материалов' },
  { year: '2020', title: 'Признание', desc: 'Международные награды за инновации' },
  { year: '2022', title: 'AI-прорыв', desc: 'Внедрение искусственного интеллекта в производство' },
  { year: '2023', title: 'Экспансия', desc: '25 магазинов в 10 странах мира' },
  { year: '2024', title: 'Будущее', desc: 'Новая эра устойчивой роскоши' },
];

const team = [
  { name: 'Анна Иванова', role: 'Главный дизайнер', initials: 'АИ', color: 'from-purple-500 to-pink-500' },
  { name: 'Максим Петров', role: 'Технический директор', initials: 'МП', color: 'from-blue-500 to-purple-500' },
  { name: 'Елена Смирнова', role: 'Директор по развитию', initials: 'ЕС', color: 'from-pink-500 to-rose-500' },
];

export default function AboutPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">

      {/* HERO — fullscreen с параллаксом */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'linear-gradient(135deg, #f3e8ff, #fce7f3, #ede9fe, #dbeafe)',
            backgroundSize: '400% 400%',
          }}
        />

        {/* Big decorative letters */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        >
          <span className="text-[30vw] font-black text-purple-100 dark:text-purple-950 leading-none tracking-tighter">
            EL
          </span>
        </motion.div>

        {/* Floating orbs */}
        {[
          { size: 400, x: '10%', y: '20%', color: 'bg-purple-300/30', dur: 8 },
          { size: 300, x: '70%', y: '60%', color: 'bg-pink-300/30', dur: 12 },
          { size: 200, x: '50%', y: '10%', color: 'bg-blue-300/30', dur: 10 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl ${orb.color}`}
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block text-xs font-bold tracking-[0.4em] text-purple-600 uppercase mb-6 px-4 py-2 bg-purple-100 rounded-full">
              О компании ELEVATE
            </span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-gray-900 leading-[0.9] tracking-tighter mb-8">
              Мода{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                будущего
              </span>
              <br />сегодня
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
              className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-1"
            >
              <div className="w-1 h-3 bg-gray-400 rounded-full" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS — горизонтальная полоса */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="text-center p-8 border-r border-gray-800 last:border-0"
              >
                <div className="text-5xl md:text-6xl font-black text-white mb-2">
                  <CountUp end={stat.number} />{stat.suffix}
                </div>
                <div className="text-gray-500 text-sm font-medium tracking-widest uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION — большой текст */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
          >
            <p className="text-xs font-bold tracking-[0.4em] text-purple-600 uppercase mb-8">Наша миссия</p>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight">
              Мы верим, что{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                стиль и ответственность
              </span>{' '}
              не противоречат друг другу — они дополняют.
            </h2>
          </motion.div>
        </div>
      </section>

      {/* VALUES — сетка с hover-эффектами */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-16 text-center"
          >
            Наши ценности
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-default"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${v.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <v.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{v.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE — горизонтальный скролл */}
      <section className="py-20 overflow-hidden">
        <div className="px-4 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white text-center"
          >
            Наша история
          </motion.h2>
        </div>

        <div className="flex gap-6 px-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
          {timeline.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0 w-72 snap-start"
            >
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 h-full border border-purple-100 dark:border-gray-700 hover:border-purple-300 transition-colors">
                <div className="text-6xl font-black text-purple-200 dark:text-purple-900 mb-4 leading-none">
                  {item.year}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-16 text-center"
          >
            Команда
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="group bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-2xl font-black mb-6 shadow-lg`}>
                  {member.initials}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-purple-400 text-sm font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute -right-40 -top-40 w-96 h-96 border border-white/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -left-20 -bottom-20 w-64 h-64 border border-white/10 rounded-full"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight"
          >
            Готовы стать частью ELEVATE?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-xl mb-12 max-w-2xl mx-auto"
          >
            Присоединяйтесь к сообществу, которое формирует будущее моды
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl"
            >
              Смотреть коллекции
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              href="/company/stores"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
            >
              Найти магазин
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
