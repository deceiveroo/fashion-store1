'use client';

import { FileText, ShoppingCart, RefreshCw, Shield, Scale, AlertCircle, Mail } from 'lucide-react';
import { LegalShell, LegalHero, LegalLayout, LegalSection, LegalList } from '@/components/legal/LegalKit';

export default function TermsPage() {
  const sections = [
    {
      icon: FileText,
      title: 'Общие положения',
      content: [
        'Настоящие Условия использования регулируют ваше использование интернет-магазина ELEVATE',
        'Используя наш сайт, вы соглашаетесь с этими условиями',
        'Мы оставляем за собой право изменять условия в любое время',
        'Продолжая использовать сайт после изменений, вы принимаете новые условия',
      ]
    },
    {
      icon: ShoppingCart,
      title: 'Заказы и оплата',
      content: [
        'Все цены указаны в рублях и включают НДС',
        'Мы оставляем за собой право изменять цены без предварительного уведомления',
        'Заказ считается принятым после получения подтверждения на email',
        'Оплата производится онлайн или при получении (в зависимости от выбранного способа)',
        'Мы принимаем банковские карты, СБП, электронные кошельки и криптовалюту',
      ]
    },
    {
      icon: RefreshCw,
      title: 'Возврат и обмен',
      content: [
        'Вы можете вернуть товар в течение 14 дней с момента получения',
        'Товар должен быть в оригинальной упаковке с бирками',
        'Возврат денег производится в течение 10 рабочих дней',
        'Обмен товара возможен при наличии аналогичного товара на складе',
        'Стоимость обратной доставки оплачивается покупателем (кроме случаев брака)',
      ]
    },
    {
      icon: Shield,
      title: 'Гарантии',
      content: [
        'Мы гарантируем качество всех товаров',
        'На товары распространяется гарантия производителя',
        'Гарантия не распространяется на механические повреждения',
        'Гарантийный ремонт производится в авторизованных сервисных центрах',
      ]
    },
    {
      icon: Scale,
      title: 'Ответственность',
      content: [
        'Мы не несем ответственности за задержки доставки по вине транспортной компании',
        'Покупатель несет ответственность за правильность указанных данных',
        'Мы не несем ответственности за неправильное использование товара',
        'Максимальная ответственность ограничена стоимостью заказа',
      ]
    },
    {
      icon: AlertCircle,
      title: 'Разрешение споров',
      content: [
        'Все споры решаются путем переговоров',
        'При невозможности договориться, спор передается в суд',
        'Применяется законодательство Российской Федерации',
        'Претензии принимаются в письменном виде на email',
      ]
    },
  ];

  const toc = [
    ...sections.map((section, index) => ({ id: `sec-${index + 1}`, title: section.title })),
    { id: 'sec-important', title: 'Важно' },
    { id: 'sec-contact', title: 'Вопросы?' },
  ];

  return (
    <LegalShell>
      <LegalHero
        icon={FileText}
        title="Условия использования"
        updated={new Date().toLocaleDateString('ru-RU')}
        intro="Добро пожаловать в ELEVATE! Пожалуйста, внимательно прочитайте эти условия использования перед использованием нашего сайта. Используя сайт, вы соглашаетесь соблюдать эти условия."
      />

      <LegalLayout toc={toc}>
        {sections.map((section, index) => (
          <LegalSection
            key={index}
            id={`sec-${index + 1}`}
            icon={section.icon}
            title={section.title}
          >
            <LegalList items={section.content} />
          </LegalSection>
        ))}

        <LegalSection id="sec-important" icon={AlertCircle} title="Важно">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Эти условия являются юридически обязывающим соглашением между вами и ELEVATE.
            Если вы не согласны с какими-либо из этих условий, пожалуйста, не используйте наш сайт.
          </p>
        </LegalSection>

        <LegalSection id="sec-contact" icon={Mail} title="Вопросы?">
          <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            Если у вас есть вопросы об условиях использования, свяжитесь с нами:
          </p>
          <a
            href="mailto:ELEVATE111@yandex.com"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            style={{
              backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)',
              boxShadow: '0 12px 28px -8px rgba(139,124,246,0.7)',
            }}
          >
            <Mail size={18} />
            Написать нам
          </a>
        </LegalSection>
      </LegalLayout>
    </LegalShell>
  );
}
