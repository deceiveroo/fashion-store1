'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, Phone, Users, Globe, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: '1. Какие данные мы собираем',
      subsections: [
        {
          subtitle: '1.1 Персональные данные',
          items: [
            'Имя, фамилия, отчество',
            'Адрес электронной почты',
            'Номер телефона',
            'Дата рождения (опционально)',
            'Пол (опционально)',
          ]
        },
        {
          subtitle: '1.2 Данные для доставки',
          items: [
            'Адрес доставки (страна, город, улица, дом, квартира)',
            'Почтовый индекс',
            'Комментарии к адресу доставки',
          ]
        },
        {
          subtitle: '1.3 Платежная информация',
          items: [
            'Последние 4 цифры банковской карты (для идентификации)',
            'Тип платежной системы (Visa, Mastercard, МИР)',
            'История транзакций и заказов',
            'Полные данные карты обрабатываются только платежными системами (Stripe, ЮMoney) и не хранятся на наших серверах',
          ]
        },
        {
          subtitle: '1.4 Технические данные',
          items: [
            'IP-адрес и геолокация',
            'Тип браузера и версия',
            'Операционная система и устройство',
            'Разрешение экрана',
            'Язык браузера',
            'Реферер (источник перехода)',
            'Время посещения и продолжительность сеанса',
          ]
        },
        {
          subtitle: '1.5 Поведенческие данные',
          items: [
            'История просмотров товаров',
            'Список избранного (wishlist)',
            'Содержимое корзины',
            'Поисковые запросы на сайте',
            'Клики и взаимодействия с элементами сайта',
            'История чатов с поддержкой',
          ]
        },
      ]
    },
    {
      icon: Lock,
      title: '2. Как мы используем ваши данные',
      subsections: [
        {
          subtitle: '2.1 Обработка заказов',
          items: [
            'Подтверждение и обработка заказов',
            'Организация доставки товаров',
            'Обработка платежей и возвратов',
            'Отправка уведомлений о статусе заказа',
            'Выставление счетов и чеков',
          ]
        },
        {
          subtitle: '2.2 Коммуникация',
          items: [
            'Ответы на ваши вопросы и запросы',
            'Техническая поддержка',
            'Уведомления о важных изменениях',
            'Информация о статусе доставки',
          ]
        },
        {
          subtitle: '2.3 Маркетинг (с вашего согласия)',
          items: [
            'Рассылка новостей и специальных предложений',
            'Персонализированные рекомендации товаров',
            'Информация о распродажах и акциях',
            'Программа лояльности и бонусы',
          ]
        },
        {
          subtitle: '2.4 Улучшение сервиса',
          items: [
            'Анализ поведения пользователей для улучшения UX',
            'A/B тестирование новых функций',
            'Выявление и исправление ошибок',
            'Оптимизация производительности сайта',
            'Разработка новых функций на основе обратной связи',
          ]
        },
        {
          subtitle: '2.5 Безопасность',
          items: [
            'Предотвращение мошенничества',
            'Защита от несанкционированного доступа',
            'Выявление подозрительной активности',
            'Соблюдение законодательных требований',
          ]
        },
      ]
    },
    {
      icon: Shield,
      title: '3. Защита и хранение данных',
      subsections: [
        {
          subtitle: '3.1 Технические меры защиты',
          items: [
            'SSL/TLS шифрование для всех передаваемых данных',
            'Шифрование паролей с использованием bcrypt (cost factor 12)',
            'Защищенные базы данных с ограниченным доступом',
            'Регулярное резервное копирование данных',
            'Межсетевые экраны (firewall) и системы обнаружения вторжений',
            'Двухфакторная аутентификация для административного доступа',
          ]
        },
        {
          subtitle: '3.2 Организационные меры',
          items: [
            'Доступ к данным только у авторизованных сотрудников',
            'Соглашения о неразглашении (NDA) со всеми сотрудниками',
            'Регулярное обучение персонала по безопасности данных',
            'Политики и процедуры обработки данных',
            'Регулярные аудиты безопасности',
          ]
        },
        {
          subtitle: '3.3 Сроки хранения',
          items: [
            'Данные аккаунта: до удаления аккаунта или 3 года неактивности',
            'История заказов: 5 лет (требование законодательства)',
            'Платежные данные: согласно требованиям PCI DSS',
            'Логи и технические данные: 12 месяцев',
            'Маркетинговые данные: до отзыва согласия',
          ]
        },
        {
          subtitle: '3.4 Соответствие стандартам',
          items: [
            'GDPR (General Data Protection Regulation)',
            'PCI DSS для обработки платежных данных',
            'Федеральный закон № 152-ФЗ "О персональных данных"',
            'ISO 27001 (информационная безопасность)',
          ]
        },
      ]
    },
    {
      icon: Eye,
      title: '4. Ваши права (GDPR)',
      subsections: [
        {
          subtitle: '4.1 Право на доступ',
          items: [
            'Вы можете запросить копию всех ваших данных',
            'Мы предоставим данные в структурированном, машиночитаемом формате',
            'Срок предоставления: до 30 дней',
            'Запрос можно отправить на privacy@elevate.com',
          ]
        },
        {
          subtitle: '4.2 Право на исправление',
          items: [
            'Вы можете исправить неточные данные в личном кабинете',
            'Для изменения критичных данных свяжитесь с поддержкой',
            'Мы обязаны исправить неточности в течение 30 дней',
          ]
        },
        {
          subtitle: '4.3 Право на удаление ("право на забвение")',
          items: [
            'Вы можете удалить свой аккаунт в любое время',
            'Некоторые данные могут храниться для соблюдения законодательства',
            'История заказов сохраняется для бухгалтерской отчетности (5 лет)',
            'Анонимизированные данные могут использоваться для статистики',
          ]
        },
        {
          subtitle: '4.4 Право на экспорт данных',
          items: [
            'Вы можете экспортировать свои данные в формате JSON',
            'Функция доступна в личном кабинете → Настройки → Экспорт данных',
            'Экспорт включает: профиль, заказы, избранное, историю',
          ]
        },
        {
          subtitle: '4.5 Право на отзыв согласия',
          items: [
            'Вы можете отозвать согласие на обработку данных в любое время',
            'Отписаться от рассылок можно по ссылке в письме',
            'Управление cookies доступно на странице /cookies',
            'Отзыв согласия не влияет на законность предыдущей обработки',
          ]
        },
        {
          subtitle: '4.6 Право на ограничение обработки',
          items: [
            'Вы можете ограничить обработку ваших данных',
            'Данные будут храниться, но не обрабатываться',
            'Применяется при оспаривании точности данных',
          ]
        },
        {
          subtitle: '4.7 Право на возражение',
          items: [
            'Вы можете возразить против обработки для маркетинга',
            'Вы можете возразить против автоматизированного принятия решений',
            'Мы прекратим обработку, если нет законных оснований',
          ]
        },
      ]
    },
    {
      icon: Users,
      title: '5. Передача данных третьим лицам',
      subsections: [
        {
          subtitle: '5.1 Платежные системы',
          items: [
            'Stripe (США) - обработка международных платежей',
            'ЮMoney (Россия) - обработка платежей в РФ',
            'Данные передаются по защищенному каналу',
            'Соответствие стандарту PCI DSS Level 1',
          ]
        },
        {
          subtitle: '5.2 Службы доставки',
          items: [
            'СДЭК, Почта России, DHL - для доставки заказов',
            'Передаются только данные, необходимые для доставки',
            'ФИО, телефон, адрес доставки',
          ]
        },
        {
          subtitle: '5.3 Аналитические сервисы',
          items: [
            'Google Analytics - анализ трафика и поведения',
            'Yandex Metrika - статистика посещений',
            'Данные анонимизированы и агрегированы',
            'Вы можете отключить аналитику в настройках cookies',
          ]
        },
        {
          subtitle: '5.4 Маркетинговые платформы',
          items: [
            'Email-рассылки (SendGrid, Mailchimp)',
            'SMS-уведомления (Twilio)',
            'Push-уведомления (Firebase Cloud Messaging)',
            'Только с вашего согласия',
          ]
        },
        {
          subtitle: '5.5 Облачная инфраструктура',
          items: [
            'Vercel - хостинг веб-приложения',
            'Neon Database - хранение данных',
            'Cloudflare - CDN и защита от DDoS',
            'Все провайдеры соответствуют GDPR',
          ]
        },
        {
          subtitle: '5.6 Когда мы НЕ передаем данные',
          items: [
            'Мы НЕ продаем ваши данные третьим лицам',
            'Мы НЕ передаем данные для спама',
            'Мы НЕ используем данные для дискриминации',
            'Передача только для указанных целей с вашего согласия',
          ]
        },
      ]
    },
    {
      icon: Globe,
      title: '6. Международная передача данных',
      subsections: [
        {
          subtitle: '6.1 Трансграничная передача',
          items: [
            'Некоторые наши партнеры находятся за пределами РФ/ЕС',
            'Передача осуществляется с соблюдением GDPR',
            'Используются стандартные договорные оговорки (SCC)',
            'Обеспечивается адекватный уровень защиты',
          ]
        },
        {
          subtitle: '6.2 Страны передачи',
          items: [
            'США - платежные системы, облачные сервисы',
            'Европейский союз - аналитика, CDN',
            'Все страны с адекватным уровнем защиты по GDPR',
          ]
        },
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
