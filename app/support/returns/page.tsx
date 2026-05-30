// app/support/returns/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle2, FileText, CreditCard, Package, XCircle, AlertTriangle, ArrowRight, Phone } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  IconBadge,
  CTABand,
  MagneticButton,
  EASE,
} from '@/components/company/PageKit';

const returnPolicies = [
  { title: 'Сроки возврата', description: 'Возврат товара возможен в течение 14 дней с момента получения', icon: Clock },
  { title: 'Условия возврата', description: 'Товар должен быть в оригинальной упаковке с бирками и без следов использования', icon: CheckCircle2 },
  { title: 'Документы', description: 'При возврате необходимо предоставить чек и паспорт', icon: FileText },
  { title: 'Способы возврата', description: 'Возврат средств осуществляется тем же способом, что и оплата', icon: CreditCard },
];

const returnSteps = [
  'Свяжитесь с нами по телефону или email',
  'Сообщите причину возврата и номер заказа',
  'Упакуйте товар в оригинальную упаковку',
  'Отправьте товар в наш магазин или передайте курьеру',
  'После проверки товара мы вернём деньги',
];

const noReturn = [
  'Нижнее бельё и купальники',
  'Товары со скидкой более 50%',
  'Аксессуары личной гигиены',
  'Распродажные товары из категории «Только на примерку»',
];

const notes = [
  'Возврат осуществляется за ваш счёт',
  'Денежные средства возвращаются в течение 10 рабочих дней',
  'Товар проверяется на соответствие условиям возврата',
  'Возврат осуществляется в течение 14 дней с момента получения товара',
];

export default function ReturnsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Поддержка"
        title="Возврат"
        highlight="товара"
        description="Мы хотим, чтобы вы были полностью довольны покупкой. Если это не так — вы можете вернуть товар."
        icon={Package}
      />

      {/* Политики */}
      <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {returnPolicies.map((p, i) => (
          <GlassCard key={p.title} tilt delay={i * 0.08} className="text-center">
            <div className="flex justify-center">
              <IconBadge icon={p.icon} />
            </div>
            <h3 className="mt-5 text-base font-bold uppercase tracking-tight text-[var(--foreground)]">
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{p.description}</p>
          </GlassCard>
        ))}
      </div>

      {/* Шаги + исключения */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard delay={0.05}>
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            <Package size={22} className="text-[#8b7cf6]" />
            Как оформить возврат
          </h2>
          <div className="space-y-3">
            {returnSteps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease: EASE }}
                className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-[var(--fc-surface-elevated)]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
                >
                  {i + 1}
                </span>
                <p className="pt-1 text-sm text-[var(--text-secondary)]">{step}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.12}>
          <h2 className="mb-6 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            Исключения
          </h2>
          <div className="space-y-5">
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/5 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-rose-500">
                <XCircle size={18} />
                Не подлежат возврату
              </h3>
              <ul className="space-y-1.5">
                {noReturn.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-500">
                <AlertTriangle size={18} />
                Пожалуйста, учтите
              </h3>
              <ul className="space-y-1.5">
                {notes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>

      <CTABand
        title="Нужна помощь с возвратом?"
        description="Наши эксперты помогут оформить возврат быстро и профессионально."
      >
        <MagneticButton href="/support/contact" variant="outline" className="!bg-white !text-gray-900">
          Связаться с нами
          <ArrowRight size={16} />
        </MagneticButton>
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
