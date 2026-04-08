// app/support/delivery/page.tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function DeliveryPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const deliveryMethods = [
    {
      title: "Курьерская доставка",
      description: "Быстрая доставка по Москве и области",
      price: "300 ₽",
      time: "1-2 дня",
      emoji: "🚚"
    },
    {
      title: "Самовывоз",
      description: "Заберите заказ в нашем магазине",
      price: "Бесплатно",
      time: "В тот же день",
      emoji: "🏪"
    },
    {
      title: "Почта России",
      description: "Доставка по всей России",
      price: "500 ₽",
      time: "3-7 дней",
      emoji: "📦"
    }
  ];

  const deliveryInfo = [
    {
      title: "Сроки доставки",
      items: [
        "Москва и область: 1-2 рабочих дня",
        "Регионы РФ: 3-7 рабочих дней",
        "Международная доставка: 7-14 дней"
      ]
    },
    {
      title: "Стоимость доставки",
      items: [
        "Курьером по Москве: 300 ₽",
        "Самовывоз: бесплатно",
        "Почта России: 500 ₽",
        "При заказе от 5000 ₽ доставка бесплатная"
      ]
    },
    {
      title: "Оплата",
      items: [
        "Наличными при получении",
        "Банковской картой онлайн",
        "Через СБП",
        "В рассрочку"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 pb-16 relative overflow-hidden">
      {/* Анимированные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full bg-purple-200/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 30}px`,
              height: `${Math.random() * 100 + 30}px`,
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

      <div className="max-w-6xl mx-auto px-4 relative z-10">
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
              <span className="text-3xl">📦</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Доставка
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Узнайте о наших способах доставки и сроках получения заказа
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {deliveryMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 + 0.1 }}
              whileHover={{ y: -15, scale: 1.03 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center border border-white/50 hover:shadow-2xl transition-all overflow-hidden"
            >
              <div className="text-4xl mb-6">{method.emoji}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{method.title}</h3>
              <p className="text-gray-800 text-base mb-6">{method.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-purple-600">{method.price}</span>
                <span className="text-gray-500">{method.time}</span>
              </div>
              
              <motion.div 
                className="mt-6 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {deliveryInfo.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h2>
              <ul className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <motion.li 
                    key={itemIndex} 
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIndex * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Есть вопросы по доставке?</h2>
          <p className="text-purple-200 mb-6 max-w-2xl mx-auto text-lg">
            Наши специалисты всегда готовы помочь вам с выбором удобного способа доставки
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