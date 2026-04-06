// app/company/careers/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Briefcase, Heart, Users, Zap, Target, Award, Coffee, Rocket, Building, Users2, Globe, MapPin, Calendar, TrendingUp } from 'lucide-react';

export default function CareersPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const benefits = [
    {
      icon: Heart,
      title: "Здоровье",
      description: "Медицинская страховка и программы поддержки здоровья"
    },
    {
      icon: Users,
      title: "Команда",
      description: "Дружная команда профессионалов в инновационной среде"
    },
    {
      icon: Zap,
      title: "Рост",
      description: "Возможности профессионального и карьерного роста"
    },
    {
      icon: Briefcase,
      title: "Гибкость",
      description: "Гибкий график работы и возможность удаленной работы"
    }
  ];

  const openPositions = [
    {
      title: "Дизайнер одежды",
      department: "Дизайн",
      type: "Полная занятость",
      location: "Москва",
      level: "Senior",
      salary: "200,000 - 300,000 ₽",
      date: "Опубликовано: 2 дня назад"
    },
    {
      title: "SMM-менеджер",
      department: "Маркетинг",
      type: "Полная занятость",
      location: "Москва / Удаленно",
      level: "Middle",
      salary: "120,000 - 180,000 ₽",
      date: "Опубликовано: 1 неделя назад"
    },
    {
      title: "Продавец-консультант",
      department: "Розничные продажи",
      type: "Частичная занятость",
      location: "Москва",
      level: "Junior",
      salary: "70,000 - 100,000 ₽",
      date: "Опубликовано: 3 дня назад"
    },
    {
      title: "Веб-дизайнер",
      department: "IT",
      type: "Полная занятость",
      location: "Москва / Удаленно",
      level: "Middle",
      salary: "150,000 - 220,000 ₽",
      date: "Опубликовано: 5 дней назад"
    }
  ];

  const careerStats = [
    { number: "95%", label: "Сотрудников рекомендуют нас", icon: TrendingUp },
    { number: "2.5", label: "Средний срок работы (года)", icon: Calendar },
    { number: "40+", label: "Проектов в год", icon: Rocket },
    { number: "8", label: "Стран присутствия", icon: Globe }
  ];

  const departments = [
    { id: 'all', name: 'Все департаменты', count: openPositions.length },
    { id: 'design', name: 'Дизайн', count: 1 },
    { id: 'marketing', name: 'Маркетинг', count: 1 },
    { id: 'retail', name: 'Розничные продажи', count: 1 },
    { id: 'it', name: 'IT', count: 1 }
  ];

  const filteredPositions = activeTab === 'all' 
    ? openPositions 
    : openPositions.filter(pos => 
        activeTab === 'design' && pos.department === 'Дизайн' ||
        activeTab === 'marketing' && pos.department === 'Маркетинг' ||
        activeTab === 'retail' && pos.department === 'Розничные продажи' ||
        activeTab === 'it' && pos.department === 'IT'
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-24 pb-16 relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
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
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 w-24 h-24 rounded-full flex items-center justify-center">
                <Rocket className="text-white" size={48} />
              </div>
            </motion.div>
          </div>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Карьера в ELEVATE
          </motion.h1>
          <motion.p 
            className="text-2xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Станьте частью команды, которая переосмысливает моду через призму устойчивости и инноваций
          </motion.p>
        </motion.div>

        {/* Career stats with animated counters */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {careerStats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg"
              whileHover={{ y: -10, scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="flex justify-center mb-3">
                <stat.icon className="text-purple-600" size={28} />
              </div>
              <motion.div 
                className="text-3xl font-bold text-purple-600 mb-2"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Почему мы?</h2>
            <div className="space-y-6 text-gray-700">
              <p>
                В ELEVATE мы верим, что работа должна вдохновлять и трансформировать. 
                Мы создаем динамичную среду, где талантливые профессионалы могут расти, 
                экспериментировать и вносить реальный вклад в развитие устойчивой моды.
              </p>
              <p>
                Наши сотрудники - это движущая сила компании. Мы активно инвестируем в 
                профессиональный рост, предлагаем конкурентоспецифичные условия и создаем 
                поддерживающую атмосферу для реализации вашего полного потенциала.
              </p>
              <p>
                Если вы разделяете наши ценности устойчивости, инноваций и качества, 
                мы приглашаем вас присоединиться к нашей вдохновляющей миссии по 
                переосмыслению индустрии моды.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Наши ценности</h2>
            <ul className="space-y-4">
              {[ 
                { icon: Target, label: "Инновации", desc: "Мы постоянно ищем новые решения и подходы" },
                { icon: Heart, label: "Устойчивость", desc: "Забота о планете в каждом аспекте бизнеса" },
                { icon: Award, label: "Качество", desc: "Стремление к совершенству во всем, что мы делаем" },
                { icon: Users, label: "Команда", desc: "Мы достигаем большего вместе" },
                { icon: Coffee, label: "Интегритет", desc: "Честность и прозрачность во всех взаимодействиях" }
              ].map((item, idx) => (
                <motion.li 
                  key={idx}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + idx * 0.1 }}
                >
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon size={16} className="text-white" />
                  </div>
                  <span className="text-gray-700">
                    <strong className="text-purple-700">{item.label}:</strong> {item.desc}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="text-3xl font-bold text-center text-gray-900 mb-12"
          >
            Преимущества работы у нас
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9 + index * 0.1 }}
                whileHover={{ y: -15, scale: 1.03 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg text-center hover:shadow-2xl transition-all border border-white/50"
              >
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <benefit.icon className="text-white" size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-700">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center text-gray-900 mb-8"
          >
            Открытые вакансии
          </motion.h2>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setActiveTab(dept.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === dept.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-purple-100'
                }`}
              >
                {dept.name} <span className="opacity-80">({dept.count})</span>
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            {filteredPositions.map((position, index) => (
              <motion.div 
                key={index}
                className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors bg-white/80 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.3 + index * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{position.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {position.department}
                      </span>
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                        {position.level}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                        <MapPin size={14} /> {position.location}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{position.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-purple-700 font-bold">{position.salary}</div>
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm inline-block mt-2">
                      {position.type}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center"
        >
          <Briefcase size={48} className="mx-auto mb-4 text-white/80" />
          <h2 className="text-2xl font-bold mb-4">Заинтересованы в работе у нас?</h2>
          <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
            Поделитесь с нами своим опытом и расскажите, как вы видите свое участие в 
            нашем пути к созданию более устойчивого будущего моды
          </p>
          <a 
            href="/support/contact" 
            className="inline-block bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Отправить резюме
          </a>
        </motion.div>
      </div>
    </div>
  );
}