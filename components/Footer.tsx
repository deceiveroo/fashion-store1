'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mail, MapPin, Phone, Send, Heart, ArrowRight
} from 'lucide-react';
import { useState } from 'react';

const socialLinks = [
  { 
    icon: () => (
      <div className="w-6 h-6 bg-contain bg-no-repeat bg-center rounded-full" 
           style={{ backgroundImage: "url('/icon/3.jpg')" }} />
    ), 
    href: 'https://vk.com/cpknikolskogo_professionalitet', 
    label: 'VK',
    color: 'hover:bg-blue-600'
  },
  { 
    icon: () => (
      <div className="w-6 h-6 bg-contain bg-no-repeat bg-center rounded-full" 
           style={{ backgroundImage: "url('/icon/2.jpg')" }} />
    ), 
    href: 'https://www.twitch.tv/shonhei', 
    label: 'Twitch',
    color: 'hover:bg-purple-600'
  },
  { 
    icon: () => (
      <div className="w-6 h-6 bg-contain bg-no-repeat bg-center rounded-full" 
           style={{ backgroundImage: "url('/icon/1.jpg')" }} />
    ), 
    href: 'https://t.me/+newnREU3Nuc0OThi', 
    label: 'Telegram',
    color: 'hover:bg-blue-500'
  },
];

const footerSections = [
  {
    title: 'Магазин',
    links: [
      { name: 'Новинки', href: '/new' },
      { name: 'Коллекции', href: '/collections' },
      { name: 'Мужское', href: '/men' },
      { name: 'Женское', href: '/women' },
      { name: 'Все товары', href: '/products' },
    ],
  },
  {
    title: 'Поддержка',
    links: [
      { name: 'Связаться', href: '/support/contact' },
      { name: 'Доставка', href: '/support/delivery' },
      { name: 'Возвраты', href: '/support/returns' },
      { name: 'Размеры', href: '/support/sizes' },
      { name: 'FAQ', href: '/support/faq' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { name: 'О Нас', href: '/company/about' },
      { name: 'Устойчивость', href: '/company/sustainability' },
      { name: 'Карьера', href: '/company/careers' },
      { name: 'Пресса', href: '/company/press' },
      { name: 'Магазины', href: '/company/stores' },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setIsSubscribed(false);
      }, 3000);
    }
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-purple-900/10 to-black dark:from-black dark:via-purple-950/20 dark:to-black text-white overflow-hidden">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <motion.h3 
              whileHover={{ scale: 1.02 }}
              className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6 inline-block"
            >
              ELEVATE
            </motion.h3>
            <p className="text-gray-400 mb-8 leading-relaxed max-w-md">
              Переосмысливаем роскошную моду с инновационным дизайном и устойчивыми практиками.
            </p>

            {/* Newsletter */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-white mb-4">
                Подпишитесь на рассылку
              </h4>
              <form onSubmit={handleSubscribe} className="relative max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите ваш email"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                  disabled={isSubscribed}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubscribed}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                >
                  {isSubscribed ? '✓' : <Send size={18} />}
                </motion.button>
              </form>
              {isSubscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 mt-3"
                >
                  Спасибо за подписку! 🎉
                </motion.p>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 ${social.color} transition-all`}
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h4 className="font-bold text-base mb-5 text-white">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <motion.li
                    key={link.name}
                    whileHover={{ x: 3 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm inline-flex items-center gap-2 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.a
              href="tel:+74951234567"
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
            >
              <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Phone size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Телефон</p>
                <p className="text-sm">+7 (495) 123-45-67</p>
              </div>
            </motion.a>
            <motion.a
              href="mailto:hello@elevate-fashion.ru"
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
            >
              <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Mail size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm">hello@elevate-fashion.ru</p>
              </div>
            </motion.a>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 text-gray-400 group"
            >
              <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <MapPin size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Адрес</p>
                <p className="text-sm">Москва, ул. Модная, 123</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-500 text-sm text-center md:text-left">
            © 2025 ELEVATE. Все права защищены. Сделано с <Heart size={14} className="inline text-red-500 mx-1" /> в России
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-gray-500 hover:text-white transition-colors"
            >
              Конфиденциальность
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-500 hover:text-white transition-colors"
            >
              Условия
            </Link>
            <Link 
              href="/cookies" 
              className="text-gray-500 hover:text-white transition-colors"
            >
              Cookies
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}