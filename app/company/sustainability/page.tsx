// app/company/sustainability/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Leaf, Recycle, Award, Users, TreePine, Wind, RotateCcw, Zap, Sun, Package, Heart, ArrowRight } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatGrid,
  SectionTitle,
  IconBadge,
  CTABand,
  MagneticButton,
  ACCENTS,
  EASE,
} from '@/components/company/PageKit';

const ACCENT = 'emerald' as const;

const impactStats = [
  { value: '75%', label: 'Снижение CO₂', icon: Wind },
  { value: '100%', label: 'Органические материалы', icon: TreePine },
  { value: '0', label: 'Отходов в природу', icon: Recycle },
  { value: '100%', label: 'Энергия из ВИЭ', icon: Sun },
];

const practices = [
  { title: 'Биоразлагаемые упаковки', description: 'Все упаковки производятся из биоразлагаемых материалов', icon: Package, impact: 'Снижение отходов на 80%' },
  { title: 'Эко-материалы', description: 'Использование органических тканей и красителей', icon: TreePine, impact: 'Снижение химвоздействия на 60%' },
  { title: 'Энергия из ВИЭ', description: 'Производство работает на 100% возобновляемой энергии', icon: Sun, impact: 'Снижение выбросов CO₂ на 50%' },
  { title: 'Программа переработки', description: 'Возврат и переработка старой одежды', icon: RotateCcw, impact: '100 000+ изделий в год' },
];

const initiatives = [
  { icon: Leaf, title: 'Экологичные материалы', description: '90% изделий из органических и переработанных материалов', progress: 90 },
  { icon: Recycle, title: 'Цикличность', description: 'Внедряем замкнутый цикл производства и переработки', progress: 75 },
  { icon: Award, title: 'Сертификация', description: 'Процессы сертифицированы международными организациями', progress: 100 },
  { icon: Users, title: 'Образование', description: 'Обучаем сотрудников принципам устойчивого производства', progress: 85 },
];

export default function SustainabilityPage() {
  const a = ACCENTS[ACCENT];
  return (
    <PageShell accent={ACCENT}>
      <PageHeader
        accent={ACCENT}
        eyebrow="Компания"
        title="Устойчивое"
        highlight="развитие"
        description="Мы создаём моду, которая не только вдохновляет, но и заботится о будущем планеты."
        icon={Leaf}
      />

      <StatGrid stats={impactStats} accent={ACCENT} />

      {/* Практики */}
      <SectionTitle className="text-center">Наши устойчивые практики</SectionTitle>
      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
        {practices.map((p, i) => (
          <GlassCard key={p.title} delay={i * 0.08} className="flex items-start gap-5">
            <IconBadge icon={p.icon} accent={ACCENT} />
            <div>
              <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">{p.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{p.description}</p>
              <span
                className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: `rgb(${a.rgb} / 0.12)`, color: a.from }}
              >
                {p.impact}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Инициативы с прогресс-барами */}
      <SectionTitle className="text-center">Наши инициативы</SectionTitle>
      <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        {initiatives.map((it, i) => (
          <GlassCard key={it.title} delay={i * 0.08}>
            <div className="flex items-start gap-4">
              <IconBadge icon={it.icon} accent={ACCENT} />
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">{it.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{it.description}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Прогресс</span>
                <span style={{ color: a.from }}>{it.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--fc-surface-elevated)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${a.from}, ${a.to})` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${it.progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: i * 0.1, ease: EASE }}
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <CTABand
        accent={ACCENT}
        icon={Heart}
        title="Присоединяйтесь к нашей миссии"
        description="Каждая покупка — голос за устойчивое будущее. Выбирайте осознанно."
      >
        <MagneticButton href="/products" variant="outline" className="!bg-white !text-gray-900">
          Изучить коллекции
          <ArrowRight size={16} />
        </MagneticButton>
      </CTABand>
    </PageShell>
  );
}
