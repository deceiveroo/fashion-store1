'use client';

import { motion } from 'framer-motion';
import { FileText, ShoppingCart, RefreshCw, Shield, Scale, AlertCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-gray-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-6">
            <FileText className="text-white" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Условия использования
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
            Добро пожаловать в ELEVATE! Пожалуйста, внимательно прочитайте эти условия использования перед 
            использованием нашего сайта. Используя сайт, вы соглашаетесь соблюдать эти условия.
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
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                  <Icon className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 shadow-xl text-white"
        >
          <div className="flex items-start gap-4">
            <AlertCircle size={32} className="flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4">Важно</h2>
              <p className="leading-relaxed">
                Эти условия являются юридически обязывающим соглашением между вами и ELEVATE. 
                Если вы не согласны с какими-либо из этих условий, пожалуйста, не используйте наш сайт.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mt-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Вопросы?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Если у вас есть вопросы об условиях использования, свяжитесь с нами:
          </p>
          <a 
            href="mailto:support@elevate.com" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Написать нам
          </a>
        </motion.div>
      </div>
    </div>
  );
}
