// app/company/sustainability/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Leaf, Recycle, Award, Users, TreePine, Droplets, Factory, Wind, RotateCcw, Zap, Sun, Droplets as DropletsIcon, Package, Heart } from 'lucide-react';

export default function SustainabilityPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('initiatives');
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const initiatives = [
    {
      icon: Leaf,
      title: "Экологичные материалы",
      description: "90% наших изделий производятся из органических и переработанных материалов",
      progress: 90
    },
    {
      icon: Recycle,
      title: "Цикличность",
      description: "Мы внедряем замкнутый цикл производства и переработки отходов",
      progress: 75
    },
    {
      icon: Award,
      title: "Сертификация",
      description: "Все наши процессы сертифицированы международными экологическими организациями",
      progress: 100
    },
    {
      icon: Users,
      title: "Образование",
      description: "Мы обучаем наших сотрудников принципам устойчивого производства",
      progress: 85
    }
  ];

  const impactStats = [
    { number: "75%", label: "Снижение углеродного следа", icon: Wind },
    { number: "100%", label: "Органические материалы", icon: TreePine },
    { number: "0", label: "Отходов в природу", icon: DropletsIcon },
    { number: "100%", label: "Энергия из ВИЭ", icon: Sun }
  ];

  const processSteps = [
    {
      title: "Экологичный дизайн",
      description: "Создание изделий с минимальным воздействием на окружающую среду",
      icon: Leaf
    },
    {
      title: "Переработка материалов",
      description: "Использование переработанных тканей и фурнитуры",
      icon: Recycle
    },
    {
      title: "Энергоэффективное производство",
      description: "Использование возобновляемой энергии на производстве",
      icon: Zap
    },
    {
      title: "Циркулярная экономика",
      description: "Программы переработки и повторного использования изделий",
      icon: RotateCcw
    }
  ];

  const sustainabilityPractices = [
    {
      title: "Биоразлагаемые упаковки",
      description: "Все наши упаковки производятся из биоразлагаемых материалов",
      icon: Package,
      impact: "Снижение отходов на 80%"
    },
    {
      title: "Эко-материалы",
      description: "Использование органических тканей и красителей",
      icon: TreePine,
      impact: "Снижение химического воздействия на 60%"
    },
    {
      title: "Энергия из ВИЭ",
      description: "Производство работает на 100% на возобновляемой энергии",
      icon: Sun,
      impact: "Снижение выбросов CO2 на 50%"
    },
    {
      title: "Программа переработки",
      description: "Программа возврата и переработки старой одежды",
      icon: RotateCcw,
      impact: "Переработка более 100,000 изделий в год"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-green-900/20 dark:to-gray-900 pt-24 pb-16 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-green-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0]
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center">
                <Leaf className="text-white" size={48} />
              </div>
            </motion.div>
          </div>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Устойчивое развитие
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Мы создаем моду, которая не только вдохновляет, но и заботится о будущем нашей планеты
          </motion.p>
        </motion.div>

        {/* Impact stats with animated counters */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {impactStats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg"
              whileHover={{ y: -10, scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="flex justify-center mb-3">
                <stat.icon className="text-green-600" size={32} />
              </div>
              <motion.div 
                className="text-3xl font-bold text-green-600 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 10,
                  delay: 1 + index * 0.1 
                }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-700 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Sustainability practices */}
        <div className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12"
          >
            Наши устойчивые практики
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sustainabilityPractices.map((practice, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 flex items-start gap-6"
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <practice.icon className="text-green-600" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{practice.title}</h3>
                  <p className="text-gray-700 mb-3">{practice.description}</p>
                  <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {practice.impact}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Initiatives section */}
        <div className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2 }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            Наши инициативы
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {initiatives.map((initiative, index) => (
              <motion.div
                key={initiative.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <initiative.icon className="text-green-600" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{initiative.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{initiative.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">Прогресс</span>
                    <span className="text-sm text-green-600">{initiative.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${initiative.progress}%` }}
                      transition={{ duration: 1.5, delay: index * 0.1 }}
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white text-center"
        >
          <Heart size={48} className="mx-auto mb-4 text-white/80" />
          <h2 className="text-2xl font-bold mb-4">Присоединяйтесь к нашей миссии</h2>
          <p className="text-green-200 mb-6 max-w-2xl mx-auto">
            Каждая покупка - это голос за устойчивое будущее. Выбирайте осознанно
          </p>
          <a 
            href="/products" 
            className="inline-block bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Изучить коллекции
          </a>
        </motion.div>
      </div>
    </div>
  );
}