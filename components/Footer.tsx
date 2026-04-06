'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const socialLinks = [
  { 
    icon: () => (
      <div className="w-6 h-6 bg-contain bg-no-repeat bg-center rounded-full" 
           style={{ backgroundImage: "url('/icon/3.jpg')" }} />
    ), 
    href: 'https://vk.com/cpknikolskogo_professionalitet', 
    label: 'VK' 
  },
  { 
    icon: () => (
      <div className="w-6 h-6 bg-contain bg-no-repeat bg-center rounded-full" 
           style={{ backgroundImage: "url('/icon/2.jpg')" }} />
    ), 
    href: 'https://www.twitch.tv/shonhei', 
    label: 'Twitch' 
  },
  { 
    icon: () => (
      <div className="w-6 h-6 bg-contain bg-no-repeat bg-center rounded-full" 
           style={{ backgroundImage: "url('/icon/1.jpg')" }} />
    ), 
    href: 'https://t.me/+newnREU3Nuc0OThi', 
    label: 'Telegram' 
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
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-950 dark:to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent mb-4">
              ELEVATE
            </h3>
            <p className="text-gray-400 dark:text-gray-500 mb-6 leading-relaxed">
              Переосмысливаем роскошную моду с инновационным дизайном и устойчивыми практиками. 
              Испытайте будущее стиля.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.2, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/10 dark:bg-white/5 rounded-full hover:bg-purple-600 dark:hover:bg-purple-500 transition-colors flex items-center justify-center"
                  style={{ transitionDelay: `${index * 100}ms` }}
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
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
            >
              <h4 className="font-semibold text-lg mb-4 text-white">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.name}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors duration-200"
                    >
                      {link.name}
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
          transition={{ duration: 0.8 }}
          className="border-t border-gray-800 dark:border-gray-900 pt-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <MapPin size={20} className="text-purple-400 dark:text-purple-300" />
              <span className="text-gray-400 dark:text-gray-500">Москва, ул. Модная, 123</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Phone size={20} className="text-purple-400 dark:text-purple-300" />
              <span className="text-gray-400 dark:text-gray-500">+7 (495) 123-45-67</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Mail size={20} className="text-purple-400 dark:text-purple-300" />
              <span className="text-gray-400 dark:text-gray-500">hello@elevate-fashion.ru</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="border-t border-gray-800 dark:border-gray-900 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 md:mb-0">
            © 2025 ELEVATE. Все права защищены.
          </p>
          <div className="flex space-x-6 text-sm text-gray-400 dark:text-gray-500">
            <Link href="#" className="hover:text-white dark:hover:text-gray-200 transition-colors">Политика конфиденциальности</Link>
            <Link href="#" className="hover:text-white dark:hover:text-gray-200 transition-colors">Условия использования</Link>
            <Link href="#" className="hover:text-white dark:hover:text-gray-200 transition-colors">Cookies</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}