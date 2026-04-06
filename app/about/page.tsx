'use client';

import { motion } from 'framer-motion';
import { Users, Target, Globe, Award, ChevronRight } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: "Миссия",
    description: "Переосмысливать моду через инновации, создавая одежду, которая не только выглядит потрясающе, но и функциональна, устойчива и технологически продвинута."
  },
  {
    icon: Globe,
    title: "Устойчивость",
    description: "Мы стремимся к нулевому воздействию на окружающую среду, используя переработанные материалы и внедряя устойчивые практики на каждом этапе производства."
  },
  {
    icon: Users,
    title: "Сообщество",
    description: "Создаем глобальное сообщество новаторов, которые ценят качество, инновации и осознанное потребление."
  },
  {
    icon: Award,
    title: "Качество",
    description: "Каждый предмет одежды проходит строгий контроль качества и создается с вниманием к деталям, чтобы служить вам долгие годы."
  }
];

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      
      {/* Hero Section with Video Background */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            aria-hidden="true"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>

        {/* Hero content */}
        <div className="relative z-20 text-center text-white max-w-4xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            О Нас
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto"
          >
            Переосмысливая будущее моды
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Наша История
              </h2>
              <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                <p className="text-lg bg-white/80 p-6 rounded-2xl shadow-lg border-l-4 border-purple-500">
                  <span className="font-bold text-purple-600">ELEVATE</span> родился из желания изменить индустрию моды. Мы верим, что одежда должна быть не только красивой, 
                  но и умной, устойчивой и функциональной.
                </p>
                <p className="text-lg bg-white/80 p-6 rounded-2xl shadow-lg border-l-4 border-pink-500">
                  Основанная в 2024 году, наша компания объединила лучших дизайнеров, инженеров и экологов для создания 
                  одежды будущего. Мы используем передовые технологии, такие как умные ткани, биометрические датчики 
                  и устойчивые материалы.
                </p>
                <p className="text-lg bg-white/80 p-6 rounded-2xl shadow-lg border-l-4 border-blue-500">
                  Сегодня <span className="font-bold text-purple-600">ELEVATE</span> — это больше чем бренд одежды. Это сообщество новаторов, стремящихся сделать мир 
                  лучше через осознанную моду.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-2xl font-bold">95%</div>
                    <div className="text-sm">Клиентов</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-sm">Поддержка</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-sm">Экологично</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Наше производство"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
              </div>
              
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl shadow-xl z-10 flex items-center justify-center hover:rotate-12 transition-all duration-500">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl"></div>
                <div className="text-white text-center p-4 relative z-10">
                  <div className="text-3xl font-bold">100+</div>
                  <div className="text-sm">Проектов</div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-pink-400 rounded-full animate-bounce"></div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl z-10 flex items-center justify-center transform rotate-12 hover:rotate-45 transition-all duration-500">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl"></div>
                <div className="text-white text-center p-4 relative z-10">
                  <div className="text-3xl font-bold">8+</div>
                  <div className="text-sm">Лет опыта</div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
              </div>
              
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl z-10 flex items-center justify-center transform -rotate-12 hover:-rotate-45 transition-all duration-500">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl"></div>
                <div className="text-white text-center p-4 relative z-10">
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm">Сотрудников</div>
                </div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Наши Ценности
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Принципы, которые направляют каждое наше решение и вдохновляют на инновации
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl group hover:shadow-2xl transition-all duration-300 border border-white/50"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105">
                      <value.icon size={40} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Наша Команда
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Талантливые профессионалы, объединенные страстью к инновациям и устойчивой моде
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl overflow-hidden shadow-xl text-center hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-80 object-cover"
                    onError={(e) => {
                      // Fallback to gradient background if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/team/default.jpg';
                      target.onerror = null;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-white" />
                      </div>
                      <span className="text-white text-sm font-medium">Эксперт</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-purple-600 font-semibold mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* Удалена секция "Присоединяйтесь к революции в моде" по запросу пользователя */}
    </div>
  );
}