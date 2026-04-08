// app/support/sizes/page.tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function SizesPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const sizeGuides = [
    {
      category: "Мужская одежда",
      sizes: [
        { size: "XS", chest: "86-89", waist: "71-74", hips: "89-92" },
        { size: "S", chest: "89-92", waist: "74-77", hips: "92-95" },
        { size: "M", chest: "92-95", waist: "77-80", hips: "95-98" },
        { size: "L", chest: "95-98", waist: "80-83", hips: "98-101" },
        { size: "XL", chest: "98-101", waist: "83-86", hips: "101-104" },
        { size: "XXL", chest: "101-104", waist: "86-89", hips: "104-107" }
      ]
    },
    {
      category: "Женская одежда",
      sizes: [
        { size: "XS", chest: "78-81", waist: "58-61", hips: "84-87" },
        { size: "S", chest: "81-84", waist: "61-64", hips: "87-90" },
        { size: "M", chest: "84-87", waist: "64-67", hips: "90-93" },
        { size: "L", chest: "87-90", waist: "67-70", hips: "93-96" },
        { size: "XL", chest: "90-93", waist: "70-73", hips: "96-99" },
        { size: "XXL", chest: "93-96", waist: "73-76", hips: "99-102" }
      ]
    }
  ];

  const measurementTips = [
    {
      title: "Как измерять обхват груди",
      description: "Измеряйте горизонтально по выступающим точкам груди. Лента должна проходить по лопаткам сзади.",
      emoji: "📏"
    },
    {
      title: "Как измерять обхват талии",
      description: "Измеряйте в самой узкой части тела, обычно это чуть выше пупка.",
      emoji: "👕"
    },
    {
      title: "Как измерять обхват бедер",
      description: "Измеряйте горизонтально по самым выступающим точкам ягодиц.",
      emoji: "👖"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 pb-16 relative overflow-hidden">
      {/* Анимированные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full bg-purple-200/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 40}px`,
              height: `${Math.random() * 100 + 40}px`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
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
              <span className="text-3xl">📏</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Таблица размеров
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Используйте нашу таблицу размеров, чтобы выбрать идеальную посадку
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {sizeGuides.map((guide, index) => (
            <motion.div
              key={guide.category}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/50"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                <h2 className="text-2xl font-bold">{guide.category}</h2>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-200">
                        <th className="text-left py-3 font-semibold text-gray-900 w-1/4">Размер</th>
                        <th className="text-left py-3 font-semibold text-gray-900 w-1/4">Грудь (см)</th>
                        <th className="text-left py-3 font-semibold text-gray-900 w-1/4">Талия (см)</th>
                        <th className="text-left py-3 font-semibold text-gray-900 w-1/4">Бедра (см)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guide.sizes.map((row, rowIndex) => (
                        <motion.tr 
                          key={rowIndex} 
                          className={`border-b border-gray-100 ${rowIndex % 2 === 0 ? 'bg-purple-50/30' : ''}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 + rowIndex * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(192, 132, 252, 0.1)' }}
                        >
                          <td className="py-4 font-semibold text-gray-900">{row.size}</td>
                          <td className="py-4 text-gray-700">{row.chest}</td>
                          <td className="py-4 text-gray-700">{row.waist}</td>
                          <td className="py-4 text-gray-700">{row.hips}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {measurementTips.map((tip, index) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -15, scale: 1.03 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-center border border-white/50 overflow-hidden"
            >
              <div className="text-4xl mb-4 mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                {tip.emoji}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tip.title}</h3>
              <p className="text-gray-700">{tip.description}</p>
              
              <motion.div 
                className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 md:p-12 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Не можете определиться с размером?</h2>
          <p className="text-purple-200 mb-8 max-w-2xl mx-auto text-lg">
            Наши специалисты помогут вам выбрать идеальный размер
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