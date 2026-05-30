'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, Eye, BarChart, Shield, CheckCircle, XCircle, SlidersHorizontal, Globe, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LegalShell, LegalHero, LegalLayout, LegalSection } from '@/components/legal/LegalKit';

interface CookieSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookiesPage() {
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-preferences');
    if (stored) {
      try {
        setCookieSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse cookie settings');
      }
    }
  }, []);

  const cookieTypes = [
    {
      icon: Shield,
      title: 'Строго необходимые cookies',
      key: 'necessary' as keyof CookieSettings,
      description: 'Эти файлы cookie необходимы для работы веб-сайта и не могут быть отключены в наших системах. Обычно они устанавливаются только в ответ на ваши действия, равнозначные запросу услуг, такие как настройка параметров конфиденциальности, вход в систему или заполнение форм.',
      examples: [
        'Аутентификация пользователя и управление сеансом',
        'Корзина покупок и данные заказа',
        'Настройки безопасности и предотвращение мошенничества',
        'Балансировка нагрузки сервера',
      ],
      duration: 'Сеанс / 1 год',
      required: true,
    },
    {
      icon: Settings,
      title: 'Функциональные cookies',
      key: 'functional' as keyof CookieSettings,
      description: 'Эти файлы cookie позволяют веб-сайту предоставлять расширенные функциональные возможности и персонализацию. Они могут устанавливаться нами или сторонними поставщиками, чьи услуги мы добавили на наши страницы.',
      examples: [
        'Сохранение языковых предпочтений',
        'Запоминание выбранной валюты',
        'Настройки отображения (размер текста, тема)',
        'Предпочтения размеров и фильтров',
      ],
      duration: '1 год',
      required: false,
    },
    {
      icon: BarChart,
      title: 'Аналитические cookies',
      key: 'analytics' as keyof CookieSettings,
      description: 'Эти файлы cookie позволяют нам подсчитывать посещения и источники трафика, чтобы мы могли измерять и улучшать производительность нашего сайта. Они помогают нам узнать, какие страницы наиболее и наименее популярны, и увидеть, как посетители перемещаются по сайту.',
      examples: [
        'Google Analytics - анализ поведения пользователей',
        'Yandex Metrika - статистика посещений',
        'Отслеживание популярных страниц и товаров',
        'Анализ эффективности маркетинговых кампаний',
      ],
      duration: '2 года',
      required: false,
    },
    {
      icon: Eye,
      title: 'Маркетинговые cookies',
      key: 'marketing' as keyof CookieSettings,
      description: 'Эти файлы cookie могут устанавливаться через наш сайт нашими рекламными партнерами. Они могут использоваться этими компаниями для создания профиля ваших интересов и показа релевантной рекламы на других сайтах.',
      examples: [
        'Ретаргетинг и персонализированная реклама',
        'Отслеживание конверсий рекламных кампаний',
        'Интеграция с социальными сетями',
        'Партнерские программы и реферальные ссылки',
      ],
      duration: '1 год',
      required: false,
    },
  ];

  const handleSaveSettings = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(cookieSettings));
    localStorage.setItem('cookie-consent-given', 'true');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setCookieSettings(allAccepted);
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted));
    localStorage.setItem('cookie-consent-given', 'true');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setCookieSettings(onlyNecessary);
    localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary));
    localStorage.setItem('cookie-consent-given', 'true');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const browsers = [
    {
      name: 'Google Chrome',
      path: 'Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов',
    },
    {
      name: 'Mozilla Firefox',
      path: 'Настройки → Приватность и защита → Куки и данные сайтов',
    },
    {
      name: 'Safari',
      path: 'Настройки → Конфиденциальность → Управление данными веб-сайтов',
    },
    {
      name: 'Microsoft Edge',
      path: 'Настройки → Файлы cookie и разрешения сайтов → Управление и удаление файлов cookie',
    },
  ];

  const toc = [
    { id: 'sec-about', title: 'Что такое cookies' },
    { id: 'types', title: 'Типы cookies' },
    { id: 'sec-manage', title: 'Управление настройками' },
    { id: 'sec-browser', title: 'Настройки в браузере' },
    { id: 'sec-related', title: 'Связанные документы' },
  ];

  return (
    <LegalShell>
      <LegalHero
        icon={Cookie}
        title="Политика использования Cookies"
        updated="29 мая 2026 г."
        intro="Мы используем файлы cookie, чтобы сайт работал корректно, запоминал ваши предпочтения и помогал нам становиться лучше. Здесь вы можете узнать о типах cookie и настроить их под себя."
      />

      <LegalLayout toc={toc}>
        {/* Что такое cookies */}
        <LegalSection id="sec-about" icon={Cookie} title="Что такое cookies?">
          <div className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            <p>
              Cookies (куки) — это небольшие текстовые файлы, которые веб-сайты сохраняют на вашем компьютере или мобильном устройстве при посещении. Они широко используются для обеспечения работы веб-сайтов или повышения эффективности их работы, а также для предоставления информации владельцам сайта.
            </p>
            <p>
              Файлы cookie помогают нам понять, как вы используете наш сайт, и улучшить ваш опыт. Они запоминают ваши предпочтения и позволяют нам предоставлять персонализированный контент.
            </p>
            <p className="font-semibold text-[#8b7cf6]">
              Важно: Cookies не содержат вирусов и не могут получить доступ к информации на вашем компьютере. Они используются исключительно для улучшения функциональности сайта.
            </p>
          </div>
        </LegalSection>

        {/* Типы cookies */}
        <LegalSection id="types" icon={Cookie} title="Типы cookies">
          <div className="space-y-5">
            {cookieTypes.map((type, index) => {
              const Icon = type.icon;
              const isEnabled = cookieSettings[type.key];

              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] p-6"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-4">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#8b7cf6]"
                        style={{ background: 'rgba(139,124,246,0.14)' }}
                      >
                        <Icon size={22} />
                      </span>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--foreground)]">
                          {type.title}
                        </h3>
                        {type.required && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-[#8b7cf6]" style={{ background: 'rgba(139,124,246,0.14)' }}>
                            <Shield size={14} />
                            Обязательные
                          </span>
                        )}
                      </div>
                    </div>

                    {!type.required && (
                      <button
                        onClick={() => setCookieSettings(prev => ({
                          ...prev,
                          [type.key]: !prev[type.key]
                        }))}
                        className={`relative h-8 w-16 shrink-0 rounded-full shadow-inner transition-all ${
                          isEnabled ? '' : 'bg-[var(--fc-glass-border)]'
                        }`}
                        style={isEnabled ? { backgroundImage: 'linear-gradient(90deg,#8b7cf6,#c4b5fd)' } : undefined}
                        aria-pressed={isEnabled}
                      >
                        <motion.div
                          animate={{ x: isEnabled ? 32 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-lg"
                        >
                          {isEnabled ? (
                            <CheckCircle size={14} className="text-[#8b7cf6]" />
                          ) : (
                            <XCircle size={14} className="text-[var(--text-secondary)]" />
                          )}
                        </motion.div>
                      </button>
                    )}
                  </div>

                  <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {type.description}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] p-5">
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                        <BarChart size={16} className="text-[#8b7cf6]" />
                        Примеры использования:
                      </p>
                      <ul className="space-y-2">
                        {type.examples.map((example, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b7cf6]" />
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] p-5">
                      <p className="mb-3 text-sm font-bold text-[var(--foreground)]">
                        Срок хранения:
                      </p>
                      <p className="mb-3 text-2xl font-bold text-[#8b7cf6]">
                        {type.duration}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {type.required
                          ? 'Эти cookies удаляются автоматически после закрытия браузера или по истечении срока действия сеанса.'
                          : 'Вы можете удалить эти cookies в любое время через настройки браузера.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </LegalSection>

        {/* Управление настройками */}
        <LegalSection id="sec-manage" icon={SlidersHorizontal} title="Управление настройками cookies">
          <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            Вы можете в любое время изменить свои предпочтения относительно cookies. Обратите внимание, что отключение некоторых типов cookies может повлиять на функциональность сайта и ваш опыт использования.
          </p>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--fc-glass-border)] p-4 text-[#8b7cf6]"
              style={{ background: 'rgba(139,124,246,0.14)' }}
            >
              <CheckCircle size={24} />
              <span className="font-semibold">Настройки успешно сохранены!</span>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSaveSettings}
              className="rounded-xl px-8 py-3.5 font-bold text-white transition-transform hover:scale-105"
              style={{ backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)', boxShadow: '0 12px 28px -8px rgba(139,124,246,0.7)' }}
            >
              Сохранить мои настройки
            </button>
            <button
              onClick={acceptAll}
              className="rounded-xl border border-[var(--fc-glass-border)] px-8 py-3.5 font-bold text-[var(--foreground)] transition-colors hover:text-[#8b7cf6]"
            >
              Принять все cookies
            </button>
            <button
              onClick={rejectAll}
              className="rounded-xl border border-[var(--fc-glass-border)] px-8 py-3.5 font-bold text-[var(--foreground)] transition-colors hover:text-[#8b7cf6]"
            >
              Только необходимые
            </button>
          </div>
        </LegalSection>

        {/* Настройки в браузере */}
        <LegalSection id="sec-browser" icon={Globe} title="Управление cookies в браузере">
          <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
            Большинство веб-браузеров позволяют управлять cookies через настройки. Вот как это сделать в популярных браузерах:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {browsers.map((browser) => (
              <div
                key={browser.name}
                className="rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] p-4"
              >
                <h3 className="mb-2 font-bold text-[var(--foreground)]">{browser.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{browser.path}</p>
              </div>
            ))}
          </div>
        </LegalSection>

        {/* Связанные документы */}
        <LegalSection id="sec-related" icon={FileText} title="Связанные документы">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="rounded-xl border border-[var(--fc-glass-border)] px-6 py-3 font-semibold text-[var(--foreground)] transition-colors hover:text-[#8b7cf6]"
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/terms"
              className="rounded-xl border border-[var(--fc-glass-border)] px-6 py-3 font-semibold text-[var(--foreground)] transition-colors hover:text-[#8b7cf6]"
            >
              Условия использования
            </Link>
          </div>
        </LegalSection>
      </LegalLayout>
    </LegalShell>
  );
}
