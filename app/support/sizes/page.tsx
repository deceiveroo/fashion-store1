// app/support/sizes/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Ruler, ArrowRight } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  CTABand,
  MagneticButton,
  EASE,
} from '@/components/company/PageKit';

const sizeGuides = [
  {
    category: 'Мужская одежда',
    sizes: [
      { size: 'XS', chest: '86-89', waist: '71-74', hips: '89-92' },
      { size: 'S', chest: '89-92', waist: '74-77', hips: '92-95' },
      { size: 'M', chest: '92-95', waist: '77-80', hips: '95-98' },
      { size: 'L', chest: '95-98', waist: '80-83', hips: '98-101' },
      { size: 'XL', chest: '98-101', waist: '83-86', hips: '101-104' },
      { size: 'XXL', chest: '101-104', waist: '86-89', hips: '104-107' },
    ],
  },
  {
    category: 'Женская одежда',
    sizes: [
      { size: 'XS', chest: '78-81', waist: '58-61', hips: '84-87' },
      { size: 'S', chest: '81-84', waist: '61-64', hips: '87-90' },
      { size: 'M', chest: '84-87', waist: '64-67', hips: '90-93' },
      { size: 'L', chest: '87-90', waist: '67-70', hips: '93-96' },
      { size: 'XL', chest: '90-93', waist: '70-73', hips: '96-99' },
      { size: 'XXL', chest: '93-96', waist: '73-76', hips: '99-102' },
    ],
  },
];

const measurementTips = [
  { title: 'Обхват груди', description: 'Измеряйте горизонтально по выступающим точкам груди. Лента проходит по лопаткам сзади.' },
  { title: 'Обхват талии', description: 'Измеряйте в самой узкой части тела, обычно чуть выше пупка.' },
  { title: 'Обхват бёдер', description: 'Измеряйте горизонтально по самым выступающим точкам ягодиц.' },
];

export default function SizesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Поддержка"
        title="Таблица"
        highlight="размеров"
        description="Используйте нашу таблицу, чтобы выбрать идеальную посадку."
        icon={Ruler}
      />

      {/* Таблицы размеров */}
      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sizeGuides.map((guide, gi) => (
          <GlassCard key={guide.category} delay={gi * 0.1} className="!p-0 overflow-hidden">
            <div
              className="px-6 py-5 text-white"
              style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
            >
              <h2 className="text-xl font-bold uppercase tracking-tight">{guide.category}</h2>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--fc-glass-border)]">
                    <th className="w-1/4 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">Размер</th>
                    <th className="w-1/4 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">Грудь</th>
                    <th className="w-1/4 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">Талия</th>
                    <th className="w-1/4 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">Бёдра</th>
                  </tr>
                </thead>
                <tbody>
                  {guide.sizes.map((row, ri) => (
                    <motion.tr
                      key={row.size}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + ri * 0.05 }}
                      className="border-b border-[var(--fc-glass-border)]/60 transition-colors last:border-0 hover:bg-[#8b7cf6]/8"
                    >
                      <td className="py-3.5 font-semibold text-[var(--foreground)]">{row.size}</td>
                      <td className="py-3.5 text-[var(--text-secondary)]">{row.chest}</td>
                      <td className="py-3.5 text-[var(--text-secondary)]">{row.waist}</td>
                      <td className="py-3.5 text-[var(--text-secondary)]">{row.hips}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-[var(--text-secondary)]">Все значения указаны в сантиметрах (см).</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Советы по измерению */}
      <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {measurementTips.map((tip, i) => (
          <GlassCard key={tip.title} tilt delay={i * 0.1}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8b7cf6]/12 text-[#8b7cf6]">
              <Ruler size={22} />
            </div>
            <h3 className="mt-5 text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
              {tip.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{tip.description}</p>
            <motion.div
              className="mt-5 h-1 rounded-full"
              style={{ background: 'linear-gradient(to right, #8b7cf6, #c4b5fd)' }}
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: EASE }}
            />
          </GlassCard>
        ))}
      </div>

      <CTABand
        title="Не можете определиться с размером?"
        description="Наши специалисты помогут вам выбрать идеальный размер."
      >
        <MagneticButton href="/support/contact" variant="outline" className="!bg-white !text-gray-900">
          Связаться с нами
          <ArrowRight size={16} />
        </MagneticButton>
      </CTABand>
    </PageShell>
  );
}
