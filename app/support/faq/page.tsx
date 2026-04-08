'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Search, Sparkles } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "Как я могу отследить свой заказ?",
      answer: "После оформления заказа вы получите электронное письмо с номером отслеживания. Вы также можете войти в свой аккаунт и перейти в раздел 'Мои заказы', чтобы отследить статус доставки.",
      category: "Заказы"
    },
    {
      question: "Какие способы оплаты вы принимаете?",
      answer: "Мы принимаем все основные кредитные и дебетовые карты, оплату через СБП, Qiwi, ЮMoney, а также наличные при получении. Все транзакции защищены современными технологиями безопасности.",
      category: "Оплата"
    },
    {
      question: "Можно ли вернуть товар?",
      answer: "Да, вы можете вернуть товар в течение 14 дней с момента получения. Товар должен быть в оригинальной упаковке с бирками и не иметь следов использования. Подробнее в разделе 'Возвраты'.",
      category: "Возвраты"
    },
    {
      question: "Сколько времени занимает доставка?",
      answer: "Доставка по Москве и области занимает 1-2 рабочих дня. По России - 3-7 рабочих дней. Международная доставка - 7-14 дней. Подробнее в разделе 'Доставка'.",
      category: "Доставка"
    },
    {
      question: "Как выбрать правильный размер?",
      answer: "Вы можете воспользоваться нашей таблицей размеров, которая находится в разделе 'Размеры'. Если у вас остались вопросы, свяжитесь с нами для консультации.",
      category: "Размеры"
    },
    {
      question: "Как ухаживать за одеждой?",
      answer: "Рекомендации по уходу указаны на бирке каждого изделия. В целом, мы рекомендуем стирать одежду при температуре 30°C, избегать отбеливателей и сушить вдали от прямых солнечных лучей.",
      category: "Уход"
    },
    {
      question: "Вы делаете скидки на большие заказы?",
      answer: "Да, мы предлагаем оптовые скидки для больших заказов. Пожалуйста, свяжитесь с нами через форму обратной связи, чтобы обсудить условия сотрудничества.",
      category: "Скидки"
    },
    {
      question: "Можно ли изменить или отменить заказ?",
      answer: "Вы можете изменить или отменить заказ в течение 24 часов после оформления. После этого, если заказ уже передан в доставку, изменения невозможны. Для этого свяжитесь с нашей службой поддержки.",
      category: "Заказы"
    }
  ];

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 pb-16 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 dark:bg-purple-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2
            }}
            className="inline-block mb-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
              <HelpCircle className="text-white" size={48} />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Часто задаваемые вопросы
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            Здесь вы найдете ответы на самые популярные вопросы
          </motion.p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-16">
          <AnimatePresence>
            {filteredFAQs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex justify-between items-center p-6 text-left hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium mb-2">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.question}
                      </h3>
                    </div>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-4"
                    >
                      <ChevronDown className="text-purple-600 dark:text-purple-400" size={24} />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <motion.p 
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            className="text-gray-700 dark:text-gray-300 pl-4 border-l-4 border-purple-300 dark:border-purple-600 leading-relaxed"
                          >
                            {item.answer}
                          </motion.p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredFAQs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Ничего не найдено. Попробуйте изменить запрос.
              </p>
            </motion.div>
          )}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-90"></div>
          <div className="absolute inset-0">
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ backgroundSize: "200% 100%" }}
            />
          </div>
          
          <div className="relative p-10 text-white text-center">
            <Sparkles className="mx-auto mb-4 text-white/80" size={48} />
            <h2 className="text-3xl font-bold mb-4">Не нашли ответ на свой вопрос?</h2>
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto text-lg">
              Наши специалисты всегда готовы ответить на ваши вопросы и оказать помощь в решении любых возникших ситуаций
            </p>
            <motion.a 
              href="/support/contact" 
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Связаться с нами
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
