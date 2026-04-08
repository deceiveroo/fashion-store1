'use client';

import { motion } from 'framer-motion';
import { Cookie, Settings, Eye, BarChart, Shield, X } from 'lucide-react';
import { useState } from 'react';

export default function CookiesPage() {
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true,
  });

  const cookieTypes = [
    {
      icon: Shield,
      title: 'Необходимые cookies',
      key: 'necessary',
      description: 'Эти cookies необходимы для работы сайта и не могут быть отключены',
      examples: ['Сессия пользователя', 'Корзина покупок', 'Настройки безопасности'],
      required: true,
    },
    {
      icon: Settings,
      title: 'Функциональные cookies',
      key: 'functional',
      description: 'Эти cookies позволяют сайту запоминать ваши предпочтения',
      examples: ['Язык интерфейса', 'Валюта', 'Размер текста', 'Темная тема'],
      required: false,
    },
    {
      icon: BarChart,
      title: 'Аналитические cookies',
      key: 'analytics',
      description: 'Помогают нам понять, как посетители используют сайт',
      examples: ['Google Analytics', 'Yandex Metrika', 'Статистика посещений'],
      required: false,
    },
    {
      icon: Eye,
      title: 'Маркетинговые cookies',
      key: 'marketing',
      description: 'Используются для показа релевантной рекламы',
      examples: ['Ретаргетинг', 'Персонализированная реклама', 'Социальные сети'],
      required: false,
    },
  ];

  const handleSaveSettings = () => {
    localStorage.setItem('cookie-settings', JSON.stringify(cookieSettings));
    alert('Настройки cookies сохранены!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-gray-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl mb-6">
            <Cookie className="text-white" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Политика использования Cookies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </motion.div>

        {/* What are Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Что такое cookies?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Cookies - это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта. 
            Они помогают сайту запоминать информацию о вашем визите, что делает следующие посещения более удобными.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Cookies не содержат вирусов и не могут получить доступ к вашим файлам. Они используются исключительно 
            для улучшения вашего опыта на сайте.
          </p>
        </motion.div>

        {/* Cookie Types */}
        {cookieTypes.map((type, index) => {
          const Icon = type.icon;
          const isEnabled = cookieSettings[type.key as keyof typeof cookieSettings];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl">
                    <Icon className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {type.title}
                    </h3>
                    {type.required && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                        Обязательные
                      </span>
                    )}
                  </div>
                </div>
                
                {!type.required && (
                  <button
                    onClick={() => setCookieSettings(prev => ({
                      ...prev,
                      [type.key]: !prev[type.key as keyof typeof prev]
                    }))}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isEnabled ? 28 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                )}
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {type.description}
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Примеры:
                </p>
                <ul className="space-y-1">
                  {type.examples.map((example, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}

        {/* Save Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 shadow-xl text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Управление cookies</h2>
          <p className="mb-6">
            Вы можете в любое время изменить настройки cookies. Обратите внимание, что отключение некоторых 
            cookies может повлиять на функциональность сайта.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSaveSettings}
              className="px-8 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Сохранить настройки
            </button>
            <button
              onClick={() => setCookieSettings({
                necessary: true,
                functional: false,
                analytics: false,
                marketing: false,
              })}
              className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              Только необходимые
            </button>
            <button
              onClick={() => setCookieSettings({
                necessary: true,
                functional: true,
                analytics: true,
                marketing: true,
              })}
              className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              Принять все
            </button>
          </div>
        </motion.div>

        {/* Browser Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mt-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Управление cookies в браузере
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Вы также можете управлять cookies через настройки вашего браузера:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Chrome:</strong> Настройки → Конфиденциальность и безопасность → Файлы cookie
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Firefox:</strong> Настройки → Приватность и защита → Куки и данные сайтов
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Safari:</strong> Настройки → Конфиденциальность → Управление данными веб-сайтов
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
