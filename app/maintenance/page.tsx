'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceConfig {
  maintenanceMode: boolean;
  title: string;
  description: string;
  endTime: string | null;
  backgroundImage: string | null;
  enableSubscription: boolean;
  galleryImages: string[];
}

export default function MaintenancePage() {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Fetch maintenance config
  useEffect(() => {
    fetch('/api/maintenance/status')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
      })
      .catch((error) => {
        console.error('Error fetching maintenance config:', error);
      });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!config?.endTime) return;

    const calculateTimeLeft = () => {
      const end = new Date(config.endTime!).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [config?.endTime]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Пожалуйста, введите корректный email');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/maintenance/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setEmail('');
      } else {
        toast.error(data.error || 'Ошибка подписки');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"
        />
      </div>

      {/* Background image if provided */}
      {config.backgroundImage && config.backgroundImage.trim() !== '' && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${config.backgroundImage})` }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Glass card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              {config.title}
            </h1>

            {/* Description */}
            <p className="text-white/80 text-center mb-8 text-lg">
              {config.description}
            </p>

            {/* Countdown Timer */}
            {timeLeft && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-4 text-white/60">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Осталось времени:</span>
                </div>
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {[
                    { value: timeLeft.days, label: 'Дней' },
                    { value: timeLeft.hours, label: 'Часов' },
                    { value: timeLeft.minutes, label: 'Минут' },
                    { value: timeLeft.seconds, label: 'Секунд' },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/10"
                    >
                      <div className="text-2xl md:text-3xl font-bold text-white">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm text-white/60 mt-1">
                        {item.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Subscription Form */}
            {config.enableSubscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ваш email для уведомления"
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                    >
                      {isSubmitting ? 'Подписка...' : 'Подписаться'}
                    </button>
                  </div>
                  <p className="text-xs text-white/40 text-center">
                    Мы отправим вам уведомление, когда сайт заработает
                  </p>
                </form>
              </motion.div>
            )}

            {/* Gallery - Displayed as cards, not background */}
            {config.galleryImages && config.galleryImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8"
              >
                <h3 className="text-white/80 text-lg font-semibold mb-6 text-center">✨ Наши работы</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.galleryImages.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="relative group"
                    >
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={img}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-4">
                          <p className="text-white/60 text-sm">Проект #{index + 1}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-white/40 text-sm mt-6"
          >
            © {new Date().getFullYear()} Fashion Store. Все права защищены.
          </motion.p>
        </motion.div>
      </div>

      {/* Meta tags for SEO */}
      <meta name="robots" content="noindex, nofollow" />
    </div>
  );
}
