// app/company/about/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Users, Award, Target, Heart, Sparkles, Star, TrendingUp, Globe, ChevronDown, Zap, Shield, Rocket, Mountain, Plane, Ship, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Улучшенные значения компании
  const values = [
    {
      icon: Shield,
      title: "Экологичность",
      description: "Мы используем только переработанные и биоразлагаемые материалы для защиты нашей планеты"
    },
    {
      icon: Zap,
      title: "Инновации",
      description: "Применяем передовые технологии в производстве для создания высококачественной продукции"
    },
    {
      icon: Heart,
      title: "Качество",
      description: "Каждый продукт проходит строгий контроль качества и создается с любовью к деталям"
    },
    {
      icon: Globe,
      title: "Сообщество",
      description: "Создаем глобальное сообщество единомышленников, разделяющих наши ценности"
    }
  ];

  // Улучшенные статистические данные
  const stats = [
    { number: "100K+", label: "Клиентов по всему миру", icon: Users },
    { number: "7+", label: "Лет на рынке", icon: TrendingUp },
    { number: "98%", label: "Довольных клиентов", icon: Star },
    { number: "500+", label: "Партнеров", icon: Building2 }
  ];

  // Обновленные данные о команде, взятые с /about
  const team = [
    { 
      name: "Анна Иванова", 
      role: "Главный дизайнер", 
      image: "/images/team/anna.jpg",
      description: "Ведущий эксперт в области устойчивой моды с более чем 10 лет опыта в индустрии"
    },
    { 
      name: "Максим Петров", 
      role: "Технический директор", 
      image: "/images/team/maxim.jpg",
      description: "Инженер с глубокими знаниями в области умных материалов и IoT-технологий"
    },
    { 
      name: "Елена Смирнова", 
      role: "Менеджер по устойчивому развитию", 
      image: "/images/team/elena.jpg",
      description: "Эксперт в области экологических стандартов и устойчивого производства"
    }
  ];

  // История компании
  const timeline = [
    { year: "2015", title: "Основание бренда ELEVATE", description: "Начало пути с миссией создавать устойчивую и стильную одежду" },
    { year: "2017", title: "Первая коллекция", description: "Выпуск первой коллекции из переработанных материалов" },
    { year: "2020", title: "Международное признание", description: "Получение наград за устойчивое производство и инновации" },
    { year: "2022", title: "Технологический прорыв", description: "Внедрение AI-технологий в производственный процесс" },
    { year: "2023", title: "Расширение по всему миру", description: "Открытие 25 магазинов в 10 странах" },
    { year: "2024", title: "Будущее начинается", description: "Запуск коллекции, вдохновленной устойчивостью" }
  ];

  // Используем spring для плавной анимации
  const springConfig = { damping: 15, stiffness: 100 };
  const scrollYProgressSpring = useSpring(scrollYProgress, springConfig);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-24 pb-16 relative overflow-x-hidden">
      {/* Легкий фон с анимированными элементами */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Анимированные градиентные пятна */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-200/30 blur-3xl"
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -50, 0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '20%', left: '10%' }}
        />
        
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-pink-200/30 blur-3xl"
          animate={{
            x: [0, -80, 0, 80, 0],
            y: [0, 60, 0, -60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '70%', left: '75%' }}
        />
      </div>

      {/* Плавающие элементы */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-purple-100/50 via-pink-100/50 to-blue-100/50 blur-2xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ top: '30%', left: '5%' }}
      />
      
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-pink-100/50 via-purple-100/50 to-blue-100/50 blur-2xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ top: '60%', left: '75%' }}
      />

      {/* Параллакс контент */}
      <div ref={containerRef} className="relative z-10">
        {/* Герой-секция */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-24 relative"
        >
          <div className="flex justify-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 10,
                delay: 0.2
              }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-full blur-2xl opacity-80"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Heart className="text-white" size={64} />
              </div>
            </motion.div>
          </div>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            О нас
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Мы переосмысливаем роскошную моду с инновационным дизайном и устойчивыми практиками
          </motion.p>
        </motion.div>

        {/* Улучшенная статистика с анимированными иконками */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-28 px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg"
              whileHover={{ y: -15, scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
            >
              <div className="flex justify-center mb-4">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-200 to-pink-200 flex items-center justify-center"
                >
                  <stat.icon className="text-purple-700" size={28} />
                </motion.div>
              </div>
              <motion.div 
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 10,
                  delay: 1.2 + index * 0.1 
                }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-700 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Улучшенная секция истории компании */}
        <div className="max-w-6xl mx-auto mb-28 relative px-4">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500 rounded-full"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16 relative z-10">
            Наша история
          </h2>
          
          <div className="space-y-16">
            {timeline.map((item, index) => (
              <motion.div 
                key={index}
                className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative z-10`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className={`md:w-5/12 p-6 ${index % 2 === 0 ? 'md:pr-16 text-right' : 'md:pl-16 text-left'}`}>
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 mb-3">{item.year}</h3>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h4>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                </div>
                
                <div className="md:w-2/12 flex justify-center">
                  <motion.div 
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 z-10 border-4 border-white flex items-center justify-center"
                    whileHover={{ scale: 1.3, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </motion.div>
                </div>
                
                <div className="md:w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Улучшенная секция команды с реальными изображениями */}
        <div className="mb-28 px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16"
          >
            Наша команда
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                whileHover={{ y: -20, scale: 1.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all overflow-hidden"
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-6 shadow-lg">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/team/default.jpg';
                        target.onerror = null;
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-purple-600 mb-3 font-medium">{member.role}</p>
                  <p className="text-gray-700 text-sm text-center">{member.description}</p>
                </div>
                
                <motion.div 
                  className="mt-6 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Улучшенная секция ценностей */}
        <div className="mb-28 px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16"
          >
            Наши ценности
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -15, scale: 1.05 }}
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-7 shadow-xl border border-white/50 text-center hover:shadow-2xl transition-all"
              >
                <motion.div 
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-200 to-pink-200 flex items-center justify-center mx-auto mb-6"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <value.icon className="text-purple-700" size={36} />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-700 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Призыв к действию */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="bg-gradient-to-r from-purple-100/70 to-pink-100/70 backdrop-blur-sm rounded-3xl p-12 text-gray-900 text-center border border-white/50 mx-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.4, type: "spring", stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            <Star size={64} className="mx-auto text-yellow-500" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-700">
            Готовы начать свой путь с ELEVATE?
          </h2>
          <p className="text-gray-700 mb-10 max-w-2xl mx-auto text-lg">
            Присоединяйтесь к глобальному сообществу, которое формирует будущее моды
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/products" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105 shadow-lg"
            >
              Исследовать коллекции
            </Link>
            <Link 
              href="/company/stores" 
              className="bg-white/70 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition-all border border-white/50"
            >
              Найти магазин
            </Link>
          </div>
        </motion.div>
      </div>
      
      {/* Убираем фиксированную стрелку вниз, т.к. она не нужна */}
    </div>
  );
}