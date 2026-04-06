// app/company/press/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, Newspaper, Mic, Award, FileText, Image, Download, Calendar, Mail, Phone, Users } from 'lucide-react';

export default function PressPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('releases');
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const pressReleases = [
    {
      title: "ELEVATE представляет новую коллекцию из переработанных материалов",
      date: "15 ноября 2025",
      excerpt: "Бренд устойчивой моды ELEVATE запускает инновационную коллекцию, созданную entirely из переработанных пластиковых бутылок.",
      category: "Коллекции",
      readTime: "3 мин"
    },
    {
      title: "ELEVATE получает международную награду за устойчивое производство",
      date: "3 октября 2025",
      excerpt: "Компания признана лидером в области устойчивого производства на международной выставке моды в Милане.",
      category: "Награды",
      readTime: "2 мин"
    },
    {
      title: "Новый flagship store ELEVATE открывается в центре Москвы",
      date: "22 сентября 2025",
      excerpt: "Бренд представляет совершенно новое концептуальное пространство, сочетающее розничные продажи и выставочный зал.",
      category: "Розничная сеть",
      readTime: "4 мин"
    }
  ];

  const mediaAssets = [
    {
      title: "Логотипы",
      description: "Логотипы компании в различных форматах и цветах",
      format: "PNG, SVG, EPS",
      icon: Award,
      files: 12
    },
    {
      title: "Фотографии продукции",
      description: "Высококачественные изображения коллекций",
      format: "JPEG, RAW",
      icon: Camera,
      files: 45
    },
    {
      title: "Фотографии команды",
      description: "Официальные фотографии основателей и команды",
      format: "JPEG, PNG",
      icon: Users,
      files: 23
    },
    {
      title: "Биографии",
      description: "Официальные биографии ключевых сотрудников",
      format: "PDF, DOCX",
      icon: FileText,
      files: 8
    }
  ];

  const pressStats = [
    { number: "200+", label: "Пресс-релизов", icon: Newspaper },
    { number: "50+", label: "Публикаций", icon: FileText },
    { number: "25+", label: "Наград", icon: Award },
    { number: "10+", label: "Лет на рынке", icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-24 pb-16 relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -120, 0],
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
                <Newspaper className="text-white" size={48} />
              </div>
            </motion.div>
          </div>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Пресс-центр
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Официальные пресс-релизы, медиа-материалы и контактная информация для СМИ
          </motion.p>
        </motion.div>

        {/* Press stats with animated counters */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {pressStats.map((stat, index) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-center border border-white/50"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Newspaper className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Пресс-релизы</h3>
            <p className="text-gray-700 mb-4">Официальные пресс-релизы компании</p>
            <span className="text-purple-600 font-semibold bg-purple-100 px-3 py-1 rounded-full text-sm">
              {pressReleases.length} материалов
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-center border border-white/50"
          >
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="text-pink-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Медиа-материалы</h3>
            <p className="text-gray-700 mb-4">Фотографии, логотипы и другие медиа-активы</p>
            <span className="text-pink-600 font-semibold bg-pink-100 px-3 py-1 rounded-full text-sm">
              {mediaAssets.length} категорий
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl text-center border border-white/50"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Контакты для СМИ</h3>
            <p className="text-gray-700 mb-4">Связь с нашим PR-отделом</p>
            <span className="text-blue-600 font-semibold">press@elevate-fashion.ru</span>
          </motion.div>
        </div>

        <div className="mb-16">
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/80 rounded-full p-1 border border-gray-200">
              <button
                onClick={() => setActiveTab('releases')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'releases'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                Пресс-релизы
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'media'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                Медиа-материалы
              </button>
            </div>
          </div>

          {activeTab === 'releases' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Newspaper className="text-purple-600" size={24} />
                Последние пресс-релизы
              </h2>
              
              <div className="space-y-6">
                {pressReleases.map((release, index) => (
                  <motion.div 
                    key={index}
                    className="border-b border-gray-200 pb-6 last:border-0 last:pb-0 p-4 rounded-lg hover:bg-purple-50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {release.category}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                        <Calendar size={14} /> {release.readTime}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{release.title}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-gray-500" />
                      <p className="text-gray-500 text-sm">{release.date}</p>
                    </div>
                    <p className="text-gray-700">{release.excerpt}</p>
                    <div className="mt-4">
                      <button className="text-purple-600 font-medium hover:text-purple-700 transition-colors flex items-center gap-1">
                        Читать далее <span>→</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Camera className="text-purple-600" size={24} />
                Медиа-активы
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mediaAssets.map((asset, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors bg-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <asset.icon className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{asset.title}</h3>
                      <p className="text-gray-700 text-sm mb-2">{asset.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-500">{asset.format}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{asset.files} файлов</span>
                        </div>
                        <Download size={16} className="text-purple-600 cursor-pointer hover:text-purple-700" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center"
        >
          <Mic size={48} className="mx-auto mb-4 text-white/80" />
          <h2 className="text-2xl font-bold mb-4">Интересует интервью или эксклюзив?</h2>
          <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
            Наши специалисты всегда готовы помочь журналистам с материалами и организацией интервью
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:press@elevate-fashion.ru" 
              className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all"
            >
              <Mail size={18} />
              press@elevate-fashion.ru
            </a>
            <a 
              href="tel:+74951234567" 
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              <Phone size={18} />
              +7 (495) 123-45-67
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}