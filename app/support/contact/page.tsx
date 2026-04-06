// app/support/contact/page.tsx
'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function ContactPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Get user agent and IP (IP would typically be determined server-side)
      const userAgent = navigator.userAgent;
      
      // Submit to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          category: formData.subject || 'general',
          userAgent,
          ipAddress: '' // IP would typically be captured server-side
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          subject: '',
          message: ''
        });
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        setSubmitError(result.error || 'An error occurred while submitting the form');
      }
    } catch (error) {
      setSubmitError('An error occurred while submitting the form');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phone input mask functionality
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Apply Russian phone number format
    if (phoneNumber.length < 2) return phoneNumber;
    if (phoneNumber.length < 5) return `+${phoneNumber.slice(0, 1)} (${phoneNumber.slice(1)}`;
    if (phoneNumber.length < 8) return `+${phoneNumber.slice(0, 1)} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4)}`;
    if (phoneNumber.length < 11) return `+${phoneNumber.slice(0, 1)} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
    return `+${phoneNumber.slice(0, 1)} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
  };

  const [phone, setPhone] = useState('');
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setPhone(formattedValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-24 pb-16 relative overflow-x-hidden">
      {/* Анимированные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full bg-purple-200/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
            }}
            animate={{
              y: [0, -50, 0],
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
              <span className="text-3xl">✉️</span>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-blue-700 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Связаться с нами
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Наши специалисты всегда готовы ответить на ваши вопросы и помочь с выбором
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Контактная информация */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.7,
              delay: 0.2
            }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Контактная информация</h2>
            
            <div className="space-y-6">
              <motion.div 
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-xl">
                  📍
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Адрес</h3>
                  <p className="text-gray-700">Москва, ул. Модная, 123</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-xl">
                  📞
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Телефон</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-gray-700">+7 (495) 123-45-67</p>
                    <a 
                      href="tel:+74951234567" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Позвонить
                    </a>
                  </div>
                  <p className="text-gray-700 mt-2">+7 (495) 987-65-43</p>
                  <a 
                    href="tel:+74959876543" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Позвонить
                  </a>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-xl">
                  ✉️
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-700">hello@elevate-fashion.ru</p>
                  <p className="text-gray-700">support@elevate-fashion.ru</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-purple-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-xl">
                  🕒
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Режим работы</h3>
                  <p className="text-gray-700">Пн-Пт: 9:00 - 21:00</p>
                  <p className="text-gray-700">Сб-Вс: 10:00 - 20:00</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Форма обратной связи */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.7,
              delay: 0.3
            }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Отправить сообщение</h2>
            
            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-xl">
                Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.
              </div>
            )}
            
            {submitError && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl">
                {submitError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Ваше имя"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                    placeholder="Ваша фамилия"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон (необязательно)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Тема
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  required
                >
                  <option value="">Выберите тему</option>
                  <option value="general">Общие вопросы</option>
                  <option value="order">Вопросы по заказу</option>
                  <option value="return">Возврат товара</option>
                  <option value="complaint">Жалоба</option>
                  <option value="cooperation">Предложение сотрудничества</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Ваше сообщение..."
                  required
                ></textarea>
              </div>
              
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl'
                } text-white py-3 px-6 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5`}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Отправка...
                    </>
                  ) : (
                    'Отправить сообщение'
                  )}
                </div>
              </motion.button>
            </form>
          </motion.div>
        </div>
        
        {/* Блок с социальными сетями - заменяем на популярные в РФ: Telegram, VK */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-10 text-white text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Мы в популярных мессенджерах</h2>
          <p className="text-purple-200 mb-6 max-w-2xl mx-auto text-lg">
            Подпишитесь на нас, чтобы быть в курсе последних новинок и акций
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.a 
              href="https://t.me/elevate_fashion" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              Telegram
            </motion.a>
            <motion.a 
              href="https://vk.com/elevate_fashion" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.976 18.018a.996.996 0 0 0 .424.224c2.106.554 4.5-.34 5.376-1.906 1.22-2.16 1.46-4.744 1.344-7.21-.08-.884.34-1.19 1.084-1.062 1.92.33 3.84.67 5.76 1.01.754.13 1.49.755 1.5 1.51.012.84-.73 1.31-1.49 1.29-1.95-.06-3.9-.11-5.85-.17-.724-.02-1.39.25-1.56.96-.22.93.26 1.62.98 1.72 2.28.32 4.57.62 6.85.94.76.1 1.52.28 2.19.65.92.51.99 1.29.58 2.2-.67 1.5-2.05 2.19-3.68 2.2-4.12.04-8.24.05-12.36.07-.69.01-1.41-.14-1.93-.58-.73-.62-.67-1.58.14-2.05.55-.33 1.2-.51 1.85-.69 1.33-.37 2.66-.74 3.99-1.11.61-.17 1.23-.33 1.84-.51.59-.17.9-.73.49-1.26-.67-.87-1.75-.68-2.65-.56-2.98.41-5.96.83-8.94 1.24-.75.1-1.5.2-2.25.3-.97.13-1.68.48-1.74 1.45-.05.78.42 1.23 1.18 1.32 2.47.3 4.94.6 7.41.9z"/>
              </svg>
              ВКонтакте
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}