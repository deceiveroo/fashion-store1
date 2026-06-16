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
    href: 'https://max.ru/', 
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
    <footer className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-purple-900/10 dark:to-black text-gray-800 dark:text-white overflow-hidden">
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-30">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl dark:hidden"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl hidden dark:block"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl dark:hidden"
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
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl hidden dark:block"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <motion.h3 
              whileHover={{ scale: 1.02 }}
              className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-4 inline-block"
            >
              ELEVATE
            </motion.h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3 md:mb-6 leading-relaxed max-w-md text-xs">
              Переосмысливаем роскошную моду с инновационным дизайном.
            </p>

            {/* Newsletter - Hidden on mobile */}
            <div className="hidden md:block mb-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Подпишитесь на рассылку
              </h4>
              <form onSubmit={handleSubscribe} className="relative max-w-xs">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите ваш email"
                  className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                  disabled={isSubscribed}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubscribed}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                >
                  {isSubscribed ? '✓' : <Send size={16} />}
                </motion.button>
              </form>
              {isSubscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-600 dark:text-green-400 mt-2"
                >
                  Спасибо за подписку! 🎉
                </motion.p>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-2">
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
                  className={`p-2 md:p-2.5 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10 ${social.color} transition-all`}
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
            
            {/* Mobile Quick Links - Visible only on mobile */}
            <div className="md:hidden mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <h4 className="font-bold text-[10px] mb-2 text-gray-800 dark:text-white uppercase tracking-wide">Магазин</h4>
                  <ul className="space-y-1.5">
                    <li><Link href="/new" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Новинки</Link></li>
                    <li><Link href="/collections" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Коллекции</Link></li>
                    <li><Link href="/men" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Мужское</Link></li>
                    <li><Link href="/women" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Женское</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[10px] mb-2 text-gray-800 dark:text-white uppercase tracking-wide">Поддержка</h4>
                  <ul className="space-y-1.5">
                    <li><Link href="/support/contact" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Связаться</Link></li>
                    <li><Link href="/support/delivery" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Доставка</Link></li>
                    <li><Link href="/support/returns" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Возвраты</Link></li>
                    <li><Link href="/support/sizes" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Размеры</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-[10px] mb-2 text-gray-800 dark:text-white uppercase tracking-wide">Компания</h4>
                  <ul className="space-y-1.5">
                    <li><Link href="/company/about" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">О Нас</Link></li>
                    <li><Link href="/company/sustainability" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Устойчивость</Link></li>
                    <li><Link href="/company/careers" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Карьера</Link></li>
                    <li><Link href="/company/press" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Пресса</Link></li>
                    <li><Link href="/company/stores" className="text-[9px] text-gray-600 dark:text-gray-400 hover:text-purple-600 block">Магазины</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Links Sections - Hidden on mobile, shown on md+ */}
          <div className="hidden md:flex md:col-span-2 lg:col-span-3 gap-6 lg:gap-8">
            {footerSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="flex-1"
              >
                <h4 className="font-bold text-sm mb-4 text-gray-800 dark:text-white">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <motion.li
                      key={link.name}
                      whileHover={{ x: 3 }}
                    >
                      <Link
                        href={link.href}
                        className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 text-sm inline-flex items-center gap-2 group"
                      >
                        <span>{link.name}</span>
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Info - Hidden on mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hidden md:block border-t border-gray-200 dark:border-gray-800 pt-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.a
              href="tel:+74951234567"
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
            >
              <div className="p-2 bg-purple-100/50 dark:bg-purple-500/10 rounded-lg group-hover:bg-purple-200/50 dark:group-hover:bg-purple-500/20 transition-colors">
                <Phone size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">Телефон</p>
                <p className="text-sm">+7 (495) 123-45-67</p>
              </div>
            </motion.a>
            <motion.a
              href="mailto:ELEVATE111@yandex.com"
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
            >
              <div className="p-2 bg-purple-100/50 dark:bg-purple-500/10 rounded-lg group-hover:bg-purple-200/50 dark:group-hover:bg-purple-500/20 transition-colors">
                <Mail size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">Email</p>
                <p className="text-sm">ELEVATE111@yandex.com</p>
              </div>
            </motion.a>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 text-gray-600 dark:text-gray-400 group"
            >
              <div className="p-2 bg-purple-100/50 dark:bg-purple-500/10 rounded-lg group-hover:bg-purple-200/50 dark:group-hover:bg-purple-500/20 transition-colors">
                <MapPin size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">Адрес</p>
                <p className="text-sm">Москва, Россия</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 dark:border-gray-800 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3"
        >
          <p className="text-gray-600 dark:text-gray-500 text-[10px] md:text-xs text-center md:text-left">
            © 2026 ELEVATE. Все права защищены.
          </p>
          <div className="hidden md:flex flex-wrap justify-center gap-4 text-xs">
            <Link 
              href="/privacy" 
              className="text-gray-600 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Конфиденциальность
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-600 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Условия
            </Link>
            <Link 
              href="/cookies" 
              className="text-gray-600 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Cookies
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}