// app/company/careers/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Heart, Users, Zap, Target, Award, Coffee, Rocket, Globe, MapPin, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatGrid,
  SectionTitle,
  IconBadge,
  CTABand,
  MagneticButton,
  Pill,
  EASE,
} from '@/components/company/PageKit';

const careerStats = [
  { value: '95%', label: 'Рекомендуют нас', icon: TrendingUp },
  { value: '2.5', label: 'Средний стаж (года)', icon: Calendar },
  { value: '40+', label: 'Проектов в год', icon: Rocket },
  { value: '8', label: 'Стран присутствия', icon: Globe },
];

const benefits = [
  { icon: Heart, title: 'Здоровье', description: 'Медицинская страховка и программы поддержки здоровья' },
  { icon: Users, title: 'Команда', description: 'Дружная команда профессионалов в инновационной среде' },
  { icon: Zap, title: 'Рост', description: 'Возможности профессионального и карьерного роста' },
  { icon: Briefcase, title: 'Гибкость', description: 'Гибкий график и возможность удалённой работы' },
];

const valuesList = [
  { icon: Target, label: 'Инновации', desc: 'Постоянно ищем новые решения и подходы' },
  { icon: Heart, label: 'Устойчивость', desc: 'Забота о планете в каждом аспекте бизнеса' },
  { icon: Award, label: 'Качество', desc: 'Стремление к совершенству во всём' },
  { icon: Users, label: 'Команда', desc: 'Мы достигаем большего вместе' },
  { icon: Coffee, label: 'Интегритет', desc: 'Честность и прозрачность во взаимодействиях' },
];

const openPositions = [
  { title: 'Дизайнер одежды', department: 'Дизайн', type: 'Полная занятость', location: 'Москва', level: 'Senior', salary: '200 000 - 300 000 ₽', date: '2 дня назад' },
  { title: 'SMM-менеджер', department: 'Маркетинг', type: 'Полная занятость', location: 'Москва / Удалённо', level: 'Middle', salary: '120 000 - 180 000 ₽', date: '1 неделя назад' },
  { title: 'Продавец-консультант', department: 'Розничные продажи', type: 'Частичная занятость', location: 'Москва', level: 'Junior', salary: '70 000 - 100 000 ₽', date: '3 дня назад' },
  { title: 'Веб-дизайнер', department: 'IT', type: 'Полная занятость', location: 'Москва / Удалённо', level: 'Middle', salary: '150 000 - 220 000 ₽', date: '5 дней назад' },
];

const departments = [
  { id: 'all', name: 'Все', match: '' },
  { id: 'design', name: 'Дизайн', match: 'Дизайн' },
  { id: 'marketing', name: 'Маркетинг', match: 'Маркетинг' },
  { id: 'retail', name: 'Розничные продажи', match: 'Розничные продажи' },
  { id: 'it', name: 'IT', match: 'IT' },
];

export default function CareersPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredPositions =
    activeTab === 'all'
      ? openPositions
      : openPositions.filter((pos) => pos.department === departments.find((d) => d.id === activeTab)?.match);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Компания"
        title="Карьера в"
        highlight="ELEVATE"
        description="Станьте частью команды, которая переосмысливает моду через призму устойчивости и инноваций."
        icon={Rocket}
      />

      <StatGrid stats={careerStats} />

      {/* Почему мы + ценности */}
      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard delay={0.05}>
          <h2 className="mb-5 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">Почему мы?</h2>
          <div className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            <p>В ELEVATE мы верим, что работа должна вдохновлять и трансформировать. Создаём динамичную среду, где талантливые профессионалы растут, экспериментируют и вносят реальный вклад в развитие устойчивой моды.</p>
            <p>Наши сотрудники — движущая сила компании. Мы инвестируем в профессиональный рост, предлагаем конкурентные условия и создаём поддерживающую атмосферу для реализации вашего потенциала.</p>
            <p>Если вы разделяете наши ценности устойчивости, инноваций и качества — мы приглашаем вас присоединиться к нашей миссии.</p>
          </div>
        </GlassCard>

        <GlassCard delay={0.12}>
          <h2 className="mb-5 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">Наши ценности</h2>
          <ul className="space-y-4">
            {valuesList.map((item, i) => (
              <motion.li
                key={item.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease: EASE }}
                className="flex items-start gap-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8b7cf6] text-white">
                  <item.icon size={15} />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  <strong className="text-[var(--foreground)]">{item.label}:</strong> {item.desc}
                </span>
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      </div>

      {/* Преимущества */}
      <SectionTitle className="text-center">Преимущества работы у нас</SectionTitle>
      <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b, i) => (
          <GlassCard key={b.title} tilt delay={i * 0.08} className="text-center">
            <div className="flex justify-center">
              <IconBadge icon={b.icon} size="lg" />
            </div>
            <h3 className="mt-5 text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">{b.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{b.description}</p>
          </GlassCard>
        ))}
      </div>

      {/* Вакансии */}
      <SectionTitle className="text-center">Открытые вакансии</SectionTitle>
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {departments.map((d) => (
          <Pill key={d.id} active={activeTab === d.id} onClick={() => setActiveTab(d.id)}>
            {d.name}
          </Pill>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPositions.map((position, index) => (
            <motion.div
              key={position.title}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ delay: index * 0.05, ease: EASE }}
              whileHover={{ x: 5 }}
              className="fc-glass-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">{position.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#8b7cf6]/12 px-3 py-1 text-xs text-[#8b7cf6]">{position.department}</span>
                  <span className="rounded-full bg-[var(--fc-surface-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">{position.level}</span>
                  <span className="flex items-center gap-1 rounded-full bg-[var(--fc-surface-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                    <MapPin size={12} /> {position.location}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Опубликовано: {position.date}</p>
              </div>
              <div className="text-left md:text-right">
                <div className="font-bold text-[var(--foreground)]">{position.salary}</div>
                <span
                  className="mt-2 inline-block rounded-full px-3 py-1 text-xs text-white"
                  style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
                >
                  {position.type}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CTABand
        icon={Briefcase}
        title="Заинтересованы в работе у нас?"
        description="Расскажите о своём опыте и о том, как вы видите участие в нашем пути к устойчивому будущему моды."
      >
        <MagneticButton href="/support/contact" variant="outline" className="!bg-white !text-gray-900">
          Отправить резюме
          <ArrowRight size={16} />
        </MagneticButton>
      </CTABand>
    </PageShell>
  );
}
