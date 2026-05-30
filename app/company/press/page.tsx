// app/company/press/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Newspaper, Mic, Award, FileText, Download, Calendar, Mail, Phone, Users, ArrowRight } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatGrid,
  IconBadge,
  CTABand,
  Pill,
  EASE,
} from '@/components/company/PageKit';

const pressStats = [
  { value: '200+', label: 'Пресс-релизов', icon: Newspaper },
  { value: '50+', label: 'Публикаций', icon: FileText },
  { value: '25+', label: 'Наград', icon: Award },
  { value: '2+', label: 'Лет на рынке', icon: Calendar },
];

const pressReleases = [
  { title: 'ELEVATE представляет новую коллекцию из переработанных материалов', date: '15 ноября 2025', excerpt: 'Бренд устойчивой моды ELEVATE запускает инновационную коллекцию, созданную полностью из переработанных пластиковых бутылок.', category: 'Коллекции', readTime: '3 мин' },
  { title: 'ELEVATE получает международную награду за устойчивое производство', date: '3 октября 2025', excerpt: 'Компания признана лидером в области устойчивого производства на международной выставке моды в Милане.', category: 'Награды', readTime: '2 мин' },
  { title: 'Новый flagship store ELEVATE открывается в центре Москвы', date: '22 сентября 2025', excerpt: 'Бренд представляет новое концептуальное пространство, сочетающее розничные продажи и выставочный зал.', category: 'Розничная сеть', readTime: '4 мин' },
];

const mediaAssets = [
  { title: 'Логотипы', description: 'Логотипы компании в различных форматах и цветах', format: 'PNG, SVG, EPS', icon: Award, files: 12 },
  { title: 'Фотографии продукции', description: 'Высококачественные изображения коллекций', format: 'JPEG, RAW', icon: Camera, files: 45 },
  { title: 'Фотографии команды', description: 'Официальные фотографии основателей и команды', format: 'JPEG, PNG', icon: Users, files: 23 },
  { title: 'Биографии', description: 'Официальные биографии ключевых сотрудников', format: 'PDF, DOCX', icon: FileText, files: 8 },
];

const categoryCards = [
  { icon: Newspaper, title: 'Пресс-релизы', text: 'Официальные пресс-релизы компании', meta: `${pressReleases.length} материалов` },
  { icon: Camera, title: 'Медиа-материалы', text: 'Фотографии, логотипы и медиа-активы', meta: `${mediaAssets.length} категорий` },
  { icon: Mic, title: 'Контакты для СМИ', text: 'Связь с нашим PR-отделом', meta: 'ELEVATE111@yandex.com' },
];

export default function PressPage() {
  const [activeTab, setActiveTab] = useState<'releases' | 'media'>('releases');

  return (
    <PageShell>
      <PageHeader
        eyebrow="Компания"
        title="Пресс"
        highlight="центр"
        description="Официальные пресс-релизы, медиа-материалы и контактная информация для СМИ."
        icon={Newspaper}
      />

      <StatGrid stats={pressStats} />

      {/* Категории */}
      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categoryCards.map((c, i) => (
          <GlassCard key={c.title} tilt delay={i * 0.1} className="text-center">
            <div className="flex justify-center">
              <IconBadge icon={c.icon} size="lg" />
            </div>
            <h3 className="mt-5 text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">{c.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{c.text}</p>
            <span className="mt-3 inline-block rounded-full bg-[#8b7cf6]/12 px-3 py-1 text-xs font-medium text-[#8b7cf6]">
              {c.meta}
            </span>
          </GlassCard>
        ))}
      </div>

      {/* Табы */}
      <div className="mb-8 flex justify-center gap-3">
        <Pill active={activeTab === 'releases'} onClick={() => setActiveTab('releases')}>Пресс-релизы</Pill>
        <Pill active={activeTab === 'media'} onClick={() => setActiveTab('media')}>Медиа-материалы</Pill>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'releases' ? (
          <motion.div
            key="releases"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ ease: EASE }}
          >
            <GlassCard hoverLift={false}>
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
                <Newspaper size={22} className="text-[#8b7cf6]" />
                Последние пресс-релизы
              </h2>
              <div className="space-y-2">
                {pressReleases.map((release, i) => (
                  <motion.div
                    key={release.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, ease: EASE }}
                    whileHover={{ x: 5 }}
                    className="rounded-2xl border-b border-[var(--fc-glass-border)] p-4 transition-colors last:border-0 hover:bg-[var(--fc-surface-elevated)]"
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#8b7cf6]/12 px-3 py-1 text-xs text-[#8b7cf6]">{release.category}</span>
                      <span className="flex items-center gap-1 rounded-full bg-[var(--fc-surface-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                        <Calendar size={12} /> {release.readTime}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{release.title}</h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{release.date}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{release.excerpt}</p>
                    <button className="mt-3 flex items-center gap-1 text-sm font-medium text-[#8b7cf6] transition-colors hover:text-[#a78bfa]">
                      Читать далее <ArrowRight size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ ease: EASE }}
          >
            <GlassCard hoverLift={false}>
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
                <Camera size={22} className="text-[#8b7cf6]" />
                Медиа-активы
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {mediaAssets.map((asset, i) => (
                  <motion.div
                    key={asset.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, ease: EASE }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-start gap-4 rounded-2xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] p-4 transition-colors hover:border-[#8b7cf6]/40"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8b7cf6]/12 text-[#8b7cf6]">
                      <asset.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--foreground)]">{asset.title}</h3>
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{asset.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[var(--text-secondary)]">{asset.format} • {asset.files} файлов</span>
                        <Download size={16} className="cursor-pointer text-[#8b7cf6] transition-colors hover:text-[#a78bfa]" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <CTABand
        icon={Mic}
        title="Интересует интервью или эксклюзив?"
        description="Наши специалисты помогут журналистам с материалами и организацией интервью."
      >
        <a
          href="mailto:ELEVATE111@yandex.com"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-gray-900 transition-colors hover:bg-gray-100"
        >
          <Mail size={16} />
          ELEVATE111@yandex.com
        </a>
        <a
          href="tel:+74951234567"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/80 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-gray-900"
        >
          <Phone size={16} />
          +7 (495) 123-45-67
        </a>
      </CTABand>
    </PageShell>
  );
}
