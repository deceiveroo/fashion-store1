// app/support/faq/page.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "Как я могу отследить свой заказ?",
      answer: "После оформления заказа вы получите электронное письмо с номером отслеживания. Вы также можете войти в свой аккаунт и перейти в раздел 'Мои заказы', чтобы отследить статус доставки."
    },
    {
      question: "Какие способы оплаты вы принимаете?",
      answer: "Мы принимаем все основные кредитные и дебетовые карты, оплату через СБП, Qiwi, ЮMoney, а также наличные при получении. Все транзакции защищены современными технологиями безопасности."
    },
    {
      question: "Можно ли вернуть товар?",
      answer: "Да, вы можете вернуть товар в течение 14 дней с момента получения. Товар должен быть в оригинальной упаковке с бирками и не иметь следов использования. Подробнее в разделе 'Возвраты'."
    },
    {
      question: "Сколько времени занимает доставка?",
      answer: "Доставка по Москве и области занимает 1-2 рабочих дня. По России - 3-7 рабочих дней. Международная доставка - 7-14 дней. Подробнее в разделе 'Доставка'."
    },
    {
      question: "Как выбрать правильный размер?",
      answer: "Вы можете воспользоваться нашей таблицей размеров, которая находится в разделе 'Размеры'. Если у вас остались вопросы, свяжитесь с нами для консультации."
    },
    {
      question: "Как ухаживать за одеждой?",
      answer: "Рекомендации по уходу указаны на бирке каждого изделия. В целом, мы рекомендуем стирать одежду при температуре 30°C, избегать отбеливателей и сушить вдали от прямых солнечных лучей."
    },
    {
      question: "Вы делаете скидки на большие заказы?",
      answer: "Да, мы предлагаем оптовые скидки для больших заказов. Пожалуйста, свяжитесь с нами через форму обратной связи, чтобы обсудить условия сотрудничества."
    },
    {
      question: "Можно ли изменить или отменить заказ?",
      answer: "Вы можете изменить или отменить заказ в течение 24 часов после оформления. После этого, если заказ уже передан в доставку, изменения невозможны. Для этого свяжитесь с нашей службой поддержки."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-24 pb-16 relative overflow-x-hidden">
      {/* Анимированные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full bg-purple-200/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 120 + 20}px`,
              height: `${Math.random() * 120 + 20}px`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
              <span className="text-3xl">❓</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Часто задаваемые вопросы
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Здесь вы найдете ответы на самые популярные вопросы
          </motion.p>
        </motion.div>

        <div className="space-y-6 mb-16">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/50"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-purple-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="text-purple-600" size={24} />
                </motion.div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <p className="text-gray-700 pl-4 border-l-4 border-purple-300 leading-relaxed">{item.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Не нашли ответ на свой вопрос?</h2>
          <p className="text-purple-200 mb-8 max-w-2xl mx-auto text-lg">
            Наши специалисты всегда готовы ответить на ваши вопросы и оказать помощь в решении любых возникших ситуаций
          </p>
          <motion.a 
            href="/support/contact" 
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Связаться с нами
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}