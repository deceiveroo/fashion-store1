'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, Search, Plus, LogOut, ChevronDown, Package, Heart } from 'lucide-react';
import SearchComponent from './Search';
import Cart from './Cart';
import ThemeToggle from './ThemeToggle';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Новинки', href: '/new' },
  { name: 'Коллекции', href: '/collections' },
  { name: 'Мужское', href: '/men' },
  { name: 'Женское', href: '/women' },
  { name: 'О Нас', href: '/about' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { state: cart } = useCart();

  // Подсчет общего количества товаров в корзине
  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрытие меню при изменении размера экрана
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  // Закрытие мобильного меню при клике на ссылку
  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-800' 
            : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/" 
                className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
              >
                ELEVATE
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -2 }}
                  className="relative"
                >
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                  <motion.div
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Component */}
              <div className="hidden md:block">
                <SearchComponent />
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {itemCount}
                  </motion.span>
                )}
              </motion.button>

              {isLoading ? (
                <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : user ? (
                <div className="hidden md:flex items-center space-x-3"> {/* Показываем только на десктопе */}
                  {/* Admin Button */}
                  {user.role === 'admin' && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                      >
                        <Plus size={16} />
                        <span>Админ</span>
                      </Link>
                    </motion.div>
                  )}
                  
                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {(user.avatar || user.image) ? (
                        <img 
                          src={user.avatar || user.image} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user?.name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                      )}
                      <ChevronDown 
                        size={20} 
                        className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>

                    {/* User Dropdown */}
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50"
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{user?.email}</p>
                        </div>
                        
                        <div className="py-2">
                          <Link 
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User size={18} />
                            <span>Профиль</span>
                          </Link>
                          
                          <Link 
                            href="/orders"
                            className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Package size={18} />
                            <span>Мои заказы</span>
                          </Link>
                          
                          <Link 
                            href="/favorites"
                            className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Heart size={18} />
                            <span>Избранное</span>
                          </Link>
                        </div>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
                          >
                            <LogOut size={18} />
                            <span>Выйти</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3"> {/* Показываем только на десктопе */}
                  {/* Register Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                    >
                      Регистрация
                    </Link>
                  </motion.div>
                  
                  {/* Login Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/auth/signin"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                    >
                      Войти
                    </Link>
                  </motion.div>
                </div>
              )}

              {/* Mobile menu button - теперь всегда видимый на мобильных устройствах */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="md:hidden p-2 text-gray-600 flex items-center justify-center"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
              >
                {isOpen ? <X size={24} className="text-purple-600" /> : <Menu size={24} className="text-purple-600" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white/95 backdrop-blur-lg rounded-lg mt-2 p-4 shadow-xl border border-gray-200 max-h-[70vh] overflow-y-auto"
              >
                {/* Mobile Search Component */}
                <div className="mb-4 md:hidden">
                  <SearchComponent />
                </div>
                
                <div className="flex flex-col space-y-3">
                  {navigation.map((item) => (
                    <motion.div
                      key={item.name}
                      whileHover={{ x: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Link
                        href={item.href}
                        className="block py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors"
                        onClick={closeMobileMenu}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Mobile User Links */}
                  {user ? (
                    <>
                      <div className="border-t border-gray-200 pt-3 mt-2">
                        <Link
                          href="/profile"
                          className="block py-2 text-gray-700 hover:text-purple-600 font-medium"
                          onClick={closeMobileMenu}
                        >
                          Мой профиль
                        </Link>
                        <Link
                          href="/orders"
                          className="block py-2 text-gray-700 hover:text-purple-600 font-medium"
                          onClick={closeMobileMenu}
                        >
                          Мои заказы
                        </Link>
                        <Link
                          href="/favorites"
                          className="block py-2 text-gray-700 hover:text-purple-600 font-medium"
                          onClick={closeMobileMenu}
                        >
                          Избранное
                        </Link>
                      </div>
                      
                      {/* Mobile Admin Link */}
                      {user?.role === 'admin' && (
                        <div className="border-t border-gray-200 pt-3 mt-2">
                          <Link
                            href="/admin"
                            className="block py-2 text-green-600 hover:text-green-700 font-medium"
                            onClick={closeMobileMenu}
                          >
                            Админка
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="border-t border-gray-200 pt-3 mt-2">
                        <Link
                          href="/auth/signup"
                          className="block py-2 text-gray-700 hover:text-purple-600 font-medium"
                          onClick={closeMobileMenu}
                        >
                          Регистрация
                        </Link>
                        <Link
                          href="/auth/signin"
                          className="block py-2 text-purple-600 hover:text-purple-700 font-medium"
                          onClick={closeMobileMenu}
                        >
                          Войти
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.header>

      {/* Cart Component */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}