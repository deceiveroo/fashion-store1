// app/support/delivery/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Truck, Store, Package, ArrowRight } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionTitle,
  IconBadge,
  CTABand,
  MagneticButton,
  EASE,
} from '@/components/company/PageKit';

const deliveryMethods = [
  { title: 'Курьерская доставка', description: 'Быстрая доставка по Москве и области', price: '300 ₽', time: '1-2 дня', icon: Truck },
  { title: 'Самовывоз', description: 'Заберите заказ в нашем магазине', price: 'Бесплатно', time: 'В тот же день', icon: Store },
  { title: 'Почта России', description: 'Доставка по всей России', price: '500 ₽', time: '3-7 дней', icon: Package },
];

const deliveryInfo = [
  {
    title: 'Сроки доставки',
    items: ['Москва и область: 1-2 рабочих дня', 'Регионы РФ: 3-7 рабочих дней', 'Международная доставка: 7-14 дней'],
  },
  {
    title: 'Стоимость доставки',
    items: ['Курьером по Москве: 300 ₽', 'Самовывоз: бесплатно', 'Почта России: 500 ₽', 'При заказе от 5000 ₽ — бесплатно'],
  },
  {
    title: 'Оплата',
    items: ['Наличными при получении', 'Банковской картой онлайн', 'Через СБП', 'В рассрочку'],
  },
];

export default function DeliveryPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Поддержка"
        title="Доставка"
        description="Узнайте о наших способах доставки и сроках получения заказа."
        icon={Truck}
      />

      {/* Способы доставки */}
      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {deliveryMethods.map((m, i) => (
          <GlassCard key={m.title} tilt delay={i * 0.1} className="flex flex-col">
            <IconBadge icon={m.icon} size="lg" />
            <h3 className="mt-6 text-xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              {m.title}
            </h3>
            <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">{m.description}</p>
            <div className="mt-6 flex items-center justify-between border-t border-[var(--fc-glass-border)] pt-4">
              <span className="text-xl font-bold text-[#8b7cf6]">{m.price}</span>
              <span className="text-sm text-[var(--text-secondary)]">{m.time}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Детальная информация */}
      <SectionTitle className="text-center">Условия доставки</SectionTitle>
      <div className="mb-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {deliveryInfo.map((section, i) => (
          <GlassCard key={section.title} delay={i * 0.1}>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item, j) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: j * 0.06, ease: EASE }}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--fc-surface-elevated)]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7cf6]" />
                  <span className="text-sm text-[var(--text-secondary)]">{item}</span>
                </motion.li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>

      <CTABand
        icon={Package}
        title="Есть вопросы по доставке?"
        description="Наши специалисты помогут выбрать удобный способ доставки."
      >
        <MagneticButton href="/support/contact" variant="outline" className="!bg-white !text-gray-900">
          Связаться с нами
          <ArrowRight size={16} />
        </MagneticButton>
      </CTABand>
    </PageShell>
  );
}
