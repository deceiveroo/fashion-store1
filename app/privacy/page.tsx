'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, Phone } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'Какие данные мы собираем',
      content: [
        'Личная информация: имя, фамилия, email, телефон',
        'Данные заказов: история покупок, адреса доставки',
        'Технические данные: IP-адрес, тип браузера, устройство',
        'Cookies и данные о поведении на сайте',
      ]
    },
    {
      icon: Lock,
      title: 'Как мы используем ваши данные',
      content: [
        'Обработка и выполнение заказов',
        'Связь с вами по вопросам заказов',
        'Улучшение качества обслуживания',
        'Персонализация предложений',
        'Аналитика и статистика',
      ]
    },
    {
      icon: Shield,
      title: 'Защита данных',
      content: [
        'Шифрование данных при передаче (SSL/TLS)',
        'Безопасное хранение в защищенных базах данных',
        'Ограниченный доступ сотрудников к данным',
        'Регулярные проверки безопасности',
        'Соответствие стандартам PCI DSS для платежей',
      ]
    },
    {
      icon: Eye,
      title: 'Ваши права (GDPR)',
      content: [
        'Право на доступ к своим данным',
        'Право на исправление неточных данных',
        'Право на удаление данных ("право на забвение")',
        'Право на экспорт данных',
        'Право на отзыв согласия',
        'Право на ограничение обработки',
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Политика конфиденциальности
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-8"
        >
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Мы в ELEVATE серьезно относимся к защите вашей конфиденциальности. Эта политика объясняет, 
            какие данные мы собираем, как их используем и какие права у вас есть в отношении ваших данных.
          </p>
        </motion.div>

        {/* Sections */}
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                  <Icon className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}

        {/* Cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-8 shadow-xl mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cookies и технологии отслеживания
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Мы используем cookies для улучшения вашего опыта на сайте. Подробнее о cookies читайте в нашей{' '}
            <a href="/cookies" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Политике использования cookies
            </a>.
          </p>
        </motion.div>

        {/* Third Parties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Передача данных третьим лицам
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Мы можем передавать ваши данные следующим категориям третьих лиц:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Платежные системы</strong> - для обработки платежей (Stripe, ЮMoney)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Службы доставки</strong> - для доставки заказов
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Аналитические сервисы</strong> - для улучшения сайта (Google Analytics, Yandex Metrika)
              </span>
            </li>
          </ul>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 shadow-xl text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Свяжитесь с нами</h2>
          <p className="mb-6">
            Если у вас есть вопросы о нашей политике конфиденциальности или вы хотите воспользоваться своими правами:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={20} />
              <a href="mailto:privacy@elevate.com" className="hover:underline">
                privacy@elevate.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={20} />
              <a href="tel:+78001234567" className="hover:underline">
                +7 (800) 123-45-67
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
