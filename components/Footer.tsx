'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Instagram, Twitter, Facebook, Mail, MapPin, Phone, Send, 
  Heart, Sparkles, TrendingUp, Shield, Truck, CreditCard,
  ArrowRight, ChevronRight
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
      { name: 'Новинки', href: '/new', icon: Sparkles },
      { name: 'Коллекции', href: '/collections', icon: TrendingUp },
      { name: 'Мужское', href: '/men' },
      { name: 'Женское', href: '/women' },
      { name: 'Все товары', href: '/products' },
    ],
  },
  {
    title: 'Поддержка',
    links: [
      { name: 'Связаться', href: '/support/contact', icon: Mail },
      { name: 'Доставка', href: '/support/delivery', icon: Truck },
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
      { name: 'Магазины', href: '/company/stores', icon: MapPin },
    ],
  },
];

const features = [
  { icon: Truck, text: 'Бесплатная доставка от 2000₽' },
  { icon: Shield, text: 'Гарантия качества' },
  { icon: CreditCard, text: 'Безопасная оплата' },
  { icon: Heart, text: 'Программа лояльности' },
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
    <footer className="relative bg-gradient-to-br from-gray-900 via-purple-900/20 to-black dark:from-black dark:via-purple-950/30 dark:to-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-b border-white/10"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-purple-500/50 transition-all group"
            >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg group-hover:scale-110 transition-transform">
                <feature.icon size={20} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {feature.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <motion.h3 
              whileHover={{ scale: 1.05 }}
              className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 inline-block"
            >
              ELEVATE
            </motion.h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Переосмысливаем роскошную моду с инновационным дизайном и устойчивыми практиками. 
              Испытайте будущее стиля.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                Подпишитесь на новости
              </h4>
              <form onSubmit={handleSubscribe} className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ваш email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  disabled={isSubscribed}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubscribed}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                >
                  {isSubscribed ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-400"
                    >
                      ✓
                    </motion.div>
                  ) : (
                    <Send size={18} />
                  )}
                </motion.button>
              </form>
              {isSubscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 mt-2"
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
                  whileHover={{ scale: 1.2, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${social.color} transition-all group`}
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
              className="lg:col-span-2 lg:col-start-auto"
            >
              <h4 className="font-bold text-lg mb-4 text-white">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => {
                  const Icon = link.icon;
                  return (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: linkIndex * 0.05 }}
                      whileHover={{ x: 5 }}
                    >
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                      >
                        {Icon && <Icon size={14} className="text-purple-400 group-hover:text-purple-300" />}
                        <span>{link.name}</span>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          ))}

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-white/20">
              <h4 className="font-bold text-lg mb-4 text-white">Контакты</h4>
              <div className="space-y-4">
                <motion.a
                  href="tel:+74951234567"
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm">+7 (495) 123-45-67</span>
                </motion.a>
                <motion.a
                  href="mailto:hello@elevate-fashion.ru"
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Mail size={16} />
                  </div>
                  <span className="text-sm">hello@elevate-fashion.ru</span>
                </motion.a>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-gray-300 group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <MapPin size={16} />
                  </div>
                  <span className="text-sm">Москва, ул. Модная, 123</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2025 ELEVATE. Все права защищены. Сделано с <Heart size={14} className="inline text-red-500" /> в России
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
              Конфиденциальность
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
              Условия
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link 
              href="/cookies" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
            >
              Cookies
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}