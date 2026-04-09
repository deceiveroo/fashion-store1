'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, Eye, BarChart, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-gray-900 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl mb-6 shadow-xl">
            <Cookie className="text-white" size={40} />
          </div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4">
            Политика использования Cookies
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Последнее обновление: 9 апреля 2026 г.
          </p>
        </motion.div>

        {/* What are Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl mb-8 border border-orange-100 dark:border-orange-900/50"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Что такое cookies?
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              Cookies (куки) — это небольшие текстовые файлы, которые веб-сайты сохраняют на вашем компьютере или мобильном устройстве при посещении. Они широко используются для обеспечения работы веб-сайтов или повышения эффективности их работы, а также для предоставления информации владельцам сайта.
            </p>
            <p>
              Файлы cookie помогают нам понять, как вы используете наш сайт, и улучшить ваш опыт. Они запоминают ваши предпочтения и позволяют нам предоставлять персонализированный контент.
            </p>
            <p className="font-semibold text-orange-600 dark:text-orange-400">
              Важно: Cookies не содержат вирусов и не могут получить доступ к информации на вашем компьютере. Они используются исключительно для улучшения функциональности сайта.
            </p>
          </div>
        </motion.div>

        {/* Cookie Types */}
        <div className="space-y-6 mb-8">
          {cookieTypes.map((type, index) => {
            const Icon = type.icon;
            const isEnabled = cookieSettings[type.key];
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100 dark:border-orange-900/50"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg flex-shrink-0">
                      <Icon className="text-white" size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {type.title}
                      </h3>
                      {type.required && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-semibold">
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
                      className={`relative w-16 h-8 rounded-full transition-all shadow-inner flex-shrink-0 ${
                        isEnabled 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: isEnabled ? 32 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                      >
                        {isEnabled ? (
                          <CheckCircle size={14} className="text-green-600" />
                        ) : (
                          <XCircle size={14} className="text-gray-400" />
                        )}
                      </motion.div>
                    </button>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {type.description}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800/50">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <BarChart size={16} className="text-orange-600" />
                      Примеры использования:
                    </p>
                    <ul className="space-y-2">
                      {type.examples.map((example, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                      Срок хранения:
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                      {type.duration}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {type.required 
                        ? 'Эти cookies удаляются автоматически после закрытия браузера или по истечении срока действия сеанса.'
                        : 'Вы можете удалить эти cookies в любое время через настройки браузера.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Save Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 shadow-2xl text-white mb-8"
        >
          <h2 className="text-3xl font-bold mb-4">Управление настройками cookies</h2>
          <p className="mb-6 text-orange-50">
            Вы можете в любое время изменить свои предпочтения относительно cookies. Обратите внимание, что отключение некоторых типов cookies может повлиять на функциональность сайта и ваш опыт использования.
          </p>
          
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500 rounded-xl flex items-center gap-3"
            >
              <CheckCircle size={24} />
              <span className="font-semibold">Настройки успешно сохранены!</span>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSaveSettings}
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold hover:shadow-2xl transition-all hover:scale-105"
            >
              Сохранить мои настройки
            </button>
            <button
              onClick={acceptAll}
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all border-2 border-white/30"
            >
              Принять все cookies
            </button>
            <button
              onClick={rejectAll}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/20 transition-all border-2 border-white/20"
            >
              Только необходимые
            </button>
          </div>
        </motion.div>

        {/* Browser Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-orange-100 dark:border-orange-900/50 mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Управление cookies в браузере
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Большинство веб-браузеров позволяют управлять cookies через настройки. Вот как это сделать в популярных браузерах:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Google Chrome</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Mozilla Firefox</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Настройки → Приватность и защита → Куки и данные сайтов
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Safari</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Настройки → Конфиденциальность → Управление данными веб-сайтов
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Microsoft Edge</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Настройки → Файлы cookie и разрешения сайтов → Управление и удаление файлов cookie
              </p>
            </div>
          </div>
        </motion.div>

        {/* Related Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-3xl p-8 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Связанные документы
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
            >
              Политика конфиденциальности
            </Link>
            <Link
              href="/terms"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
            >
              Условия использования
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
