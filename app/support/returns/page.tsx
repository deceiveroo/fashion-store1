// app/support/returns/page.tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ReturnsPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const returnPolicies = [
    {
      title: "Сроки возврата",
      description: "Возврат товара возможен в течение 14 дней с момента получения",
      emoji: "⏰"
    },
    {
      title: "Условия возврата",
      description: "Товар должен быть в оригинальной упаковке с бирками и не иметь следов использования",
      emoji: "✅"
    },
    {
      title: "Документы",
      description: "При возврате необходимо предоставить чек и паспорт",
      emoji: "📋"
    },
    {
      title: "Способы возврата",
      description: "Возврат денежных средств осуществляется тем же способом, что и оплата",
      emoji: "💳"
    }
  ];

  const returnSteps = [
    "Свяжитесь с нами по телефону или email",
    "Сообщите причину возврата и номер заказа",
    "Упакуйте товар в оригинальную упаковку",
    "Отправьте товар в наш магазин или передайте курьеру",
    "После проверки товара мы вернем деньги"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 pb-16 relative overflow-hidden">
      {/* Анимированные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(18)].map((_, i) => (
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
              y: [0, -60, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.7, 1.3, 0.7]
            }}
            transition={{
              duration: Math.random() * 7 + 5,
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
              <span className="text-3xl">🔄</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Возврат товара
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Мы хотим, чтобы вы были полностью довольны покупкой. Если это не так, вы можете вернуть товар
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {returnPolicies.map((policy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -15, scale: 1.03 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all overflow-hidden"
            >
              <div className="text-3xl text-center mb-4">{policy.emoji}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{policy.title}</h3>
              <p className="text-gray-700 leading-relaxed text-center">{policy.description}</p>
              
              <motion.div 
                className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-purple-600 mb-6 flex items-center gap-2">
              📦 Как оформить возврат
            </h2>
            <div className="space-y-4">
              {returnSteps.map((step, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-purple-50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-purple-600 mb-6">Исключения</h2>
            <div className="space-y-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  ❌ Товары надлежащего качества, не подлежащие возврату:
                </h3>
                <ul className="text-red-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Нижнее белье и купальники</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Товары со скидкой более 50%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Аксессуары личной гигиены</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Распродажные товары из категории "Только на примерку"</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <h3 className="font-semibold text-yellow-800 mb-2">Пожалуйста, учтите:</h3>
                <ul className="text-yellow-700 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>Возврат осуществляется за ваш счет</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>Денежные средства возвращаются в течение 10 рабочих дней</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>Товар проверяется на соответствие условиям возврата</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>Возврат возможен в течение 30 дней с момента покупки</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Нужна помощь с возвратом?</h2>
          <p className="text-purple-200 mb-8 max-w-2xl mx-auto text-lg">
            Наши эксперты по возвратам помогут вам оформить возврат быстро и профессионально
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a 
              href="/support/contact" 
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Связаться с нами
            </motion.a>
            <motion.a 
              href="tel:+74951234567" 
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-purple-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Позвонить: +7 (495) 123-45-67
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}