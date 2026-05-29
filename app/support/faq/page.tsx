'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Search, ArrowRight } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  CTABand,
  MagneticButton,
  Pill,
  EASE,
} from '@/components/company/PageKit';

type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

const faqItems: FaqItem[] = [
  {
    question: 'Как я могу отследить свой заказ?',
    answer:
      "После оформления заказа вы получите электронное письмо с номером отслеживания. Вы также можете войти в свой аккаунт и перейти в раздел «Мои заказы», чтобы отследить статус доставки.",
    category: 'Заказы',
  },
  {
    question: 'Какие способы оплаты вы принимаете?',
    answer:
      'Мы принимаем все основные кредитные и дебетовые карты, оплату через СБП, Qiwi, ЮMoney, а также наличные при получении. Все транзакции защищены современными технологиями безопасности.',
    category: 'Оплата',
  },
  {
    question: 'Можно ли вернуть товар?',
    answer:
      "Да, вы можете вернуть товар в течение 14 дней с момента получения. Товар должен быть в оригинальной упаковке с бирками и не иметь следов использования. Подробнее в разделе «Возвраты».",
    category: 'Возвраты',
  },
  {
    question: 'Сколько времени занимает доставка?',
    answer:
      'Доставка по Москве и области занимает 1-2 рабочих дня. По России — 3-7 рабочих дней. Международная доставка — 7-14 дней. Подробнее в разделе «Доставка».',
    category: 'Доставка',
  },
  {
    question: 'Как выбрать правильный размер?',
    answer:
      "Вы можете воспользоваться нашей таблицей размеров, которая находится в разделе «Размеры». Если у вас остались вопросы, свяжитесь с нами для консультации.",
    category: 'Размеры',
  },
  {
    question: 'Как ухаживать за одеждой?',
    answer:
      'Рекомендации по уходу указаны на бирке каждого изделия. В целом, мы рекомендуем стирать одежду при температуре 30°C, избегать отбеливателей и сушить вдали от прямых солнечных лучей.',
    category: 'Уход',
  },
  {
    question: 'Вы делаете скидки на большие заказы?',
    answer:
      'Да, мы предлагаем оптовые скидки для больших заказов. Пожалуйста, свяжитесь с нами через форму обратной связи, чтобы обсудить условия сотрудничества.',
    category: 'Скидки',
  },
  {
    question: 'Можно ли изменить или отменить заказ?',
    answer:
      'Вы можете изменить или отменить заказ в течение 24 часов после оформления. После этого, если заказ уже передан в доставку, изменения невозможны. Для этого свяжитесь с нашей службой поддержки.',
    category: 'Заказы',
  },
];

const ALL = 'Все';

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(faqItems.map((i) => i.category)))],
    []
  );

  const filteredFAQs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqItems.filter((item) => {
      const matchesCategory = activeCategory === ALL || item.category === activeCategory;
      const matchesSearch =
        q === '' ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Поддержка"
        title="Частые"
        highlight="вопросы"
        description="Здесь вы найдёте ответы на самые популярные вопросы о заказах, доставке, оплате и возвратах."
        icon={HelpCircle}
      />

      {/* Поиск */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mx-auto mb-6 max-w-2xl"
      >
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по вопросам..."
            className="w-full rounded-2xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] py-3.5 pl-12 pr-4 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none backdrop-blur-md transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40"
          />
        </div>
      </motion.div>

      {/* Фильтр по категориям */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
        className="mb-12 flex flex-wrap justify-center gap-2.5"
      >
        {categories.map((cat) => (
          <Pill
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Pill>
        ))}
      </motion.div>

      {/* Список вопросов */}
      <div className="mx-auto max-w-3xl space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredFAQs.map((item, index) => {
            const key = `${item.category}-${item.question}`;
            const isOpen = openKey === key;
            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: EASE }}
                className="fc-glass-card overflow-hidden !p-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-[var(--fc-surface-elevated)]"
                  aria-expanded={isOpen}
                >
                  <div className="flex-1">
                    <span className="mb-2 inline-block rounded-full border border-[#8b7cf6]/30 bg-[#8b7cf6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b7cf6]">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold tracking-tight text-[var(--foreground)] sm:text-lg">
                      {item.question}
                    </h3>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="shrink-0 text-[#8b7cf6]"
                  >
                    <ChevronDown size={22} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="border-l-2 border-[#8b7cf6]/40 px-6 pb-6 pl-7 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredFAQs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fc-glass-card py-14 text-center"
          >
            <HelpCircle className="mx-auto mb-4 text-[var(--text-secondary)]" size={36} />
            <p className="text-base text-[var(--foreground)]">Ничего не найдено</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Попробуйте изменить запрос или выбрать другую категорию.
            </p>
          </motion.div>
        )}
      </div>

      <CTABand
        title="Не нашли ответ на свой вопрос?"
        description="Наши специалисты всегда готовы помочь и ответить на любые ваши вопросы."
      >
        <MagneticButton href="/support/contact" variant="outline" className="!bg-white !text-gray-900">
          Связаться с нами
          <ArrowRight size={16} />
        </MagneticButton>
      </CTABand>
    </PageShell>
  );
}
