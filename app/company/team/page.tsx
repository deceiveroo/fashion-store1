'use client';

import { motion } from 'framer-motion';
import { Users, Lightbulb, Zap, Heart } from 'lucide-react';

const teamMembers = [
  {
    name: "Анна Иванова",
    role: "Главный дизайнер",
    bio: "Эксперт в области устойчивых материалов и инновационных тканей. Создает коллекции, которые сочетают в себе эстетику и экологичность.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    specialty: "Дизайн и материалы",
    icon: Lightbulb
  },
  {
    name: "Максим Петров",
    role: "Технический директор",
    bio: "Инженер с более чем 15-летним опытом в технологической индустрии. Отвечает за внедрение умных технологий в одежду.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    specialty: "Технологии",
    icon: Zap
  },
  {
    name: "Елена Смирнова",
    role: "Менеджер по устойчивому развитию",
    bio: "Эколог и активист с глубокими знаниями в области устойчивого производства. Следит за соблюдением экологических стандартов.",
    image: "https://images.unsplash.com/photo-1573496358961-3c82838ef664?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    specialty: "Экология",
    icon: Heart
  },
  {
    name: "Дмитрий Козлов",
    role: "Креативный директор",
    bio: "Визионер в индустрии моды. Создает концепции, которые формируют будущее моды и вдохновляют миллионы людей.",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    specialty: "Креатив",
    icon: Lightbulb
  },
  {
    name: "Мария Волкова",
    role: "Директор по маркетингу",
    bio: "Эксперт по цифровым технологиям и инновационному маркетингу. Помогает брендам общаться с новым поколением потребителей.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    specialty: "Маркетинг",
    icon: Users
  },
  {
    name: "Алексей Соколов",
    role: "Руководитель производства",
    bio: "Специалист по производству с 20-летним опытом. Обеспечивает высокое качество продукции и соблюдение стандартов.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    specialty: "Производство",
    icon: Zap
  }
];

const coreValues = [
  {
    title: "Инновации",
    description: "Мы постоянно экспериментируем с новыми технологиями и материалами",
    icon: Lightbulb
  },
  {
    title: "Устойчивость",
    description: "Заботимся о планете и создаем долговечные продукты",
    icon: Heart
  },
  {
    title: "Коллаборация",
    description: "Работаем сообща, объединяя различные области экспертизы",
    icon: Users
  },
  {
    title: "Экспертиза",
    description: "Глубокие знания в своих областях позволяют создавать лучшие решения",
    icon: Zap
  }
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Наша <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Команда</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Талантливые профессионалы, объединенные общей миссией - переосмысливать будущее моды
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Наши Ключевые Ценности
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Принципы, которые лежат в основе нашей работы и вдохновляют нас на инновации
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center group hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                  <value.icon size={28} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Встречайте Нашу Команду
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Эксперты из разных областей, работающие вместе для создания инновационной моды
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => {
              const IconComponent = member.icon;
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-2">
                        <IconComponent size={20} className="text-white" />
                        <span className="text-white text-sm font-medium">{member.specialty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-purple-600 font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-600 leading-relaxed">{member.bio}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Хотите стать частью нашей команды?
            </h2>
            <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
              Мы всегда ищем талантливых людей, разделяющих наши ценности и стремящиеся к инновациям
            </p>
            <motion.a
              href="/company/careers"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Посмотреть вакансии
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}