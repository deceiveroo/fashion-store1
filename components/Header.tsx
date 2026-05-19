'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, Search as SearchIcon, Plus, LogOut, ChevronDown, Package, Heart, Bell } from 'lucide-react';
import SearchComponent from './SearchNew';
import Cart from './Cart';
import ThemeToggle from './ThemeToggle';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Новинки', href: '/new' },
  { name: 'Коллекции', href: '/collections' },
  { name: 'Мужское', href: '/men' },
  { name: 'Женское', href: '/women' },
  { name: 'О нас', href: '/company/about' },
];

export default function Header() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
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

  // Fetch unread notifications count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setNotifications(data.notifications?.slice(0, 5) || []); // Загружаем только последние 5
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Обновляем локальное состояние
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Очистить все уведомления?')) return;
    
    try {
      const res = await fetch('/api/notifications/clear', {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        // Перезагружаем данные
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

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

  // Dispatch user menu state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('userMenuStateChange', { detail: { isOpen: isUserMenuOpen } }));
  }, [isUserMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the user menu button and dropdown
      if (!target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

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
            ? 'bg-white/98 dark:bg-gray-900/98 backdrop-blur-md md:backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-800' 
            : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm md:backdrop-blur-md border-b border-gray-100 dark:border-gray-800'
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
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
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
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {/* Search Component - Desktop only */}
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

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
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
                  <div className="relative" data-user-menu>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                    >
                      {(user.avatar || user.image) ? (
                        <div className="relative">
                          {/* Bouncing Avatar Animation */}
                          <div className={unreadCount > 0 ? 'animate-bounce' : ''} style={{ animationDuration: '1s', animationIterationCount: 'infinite' }}>
                            <Image 
                              src={user.avatar || user.image} 
                              alt="Avatar" 
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                              priority
                            />
                          </div>
                          {/* Small notification dot */}
                          {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-white dark:border-gray-900 shadow-md"></span>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Bouncing Avatar Animation */}
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ${
                            unreadCount > 0 ? 'animate-bounce' : ''
                          }`} style={unreadCount > 0 ? { animationDuration: '1s', animationIterationCount: 'infinite' } : {}}>
                            {user?.name?.[0] || user?.email?.[0] || 'U'}
                          </div>
                          {/* Small notification dot */}
                          {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-white dark:border-gray-900 shadow-md"></span>
                          )}
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
                        data-user-menu
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-[70]"
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
                        
                        {/* Notifications Button */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsNotificationsModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg group"
                        >
                          <div className="relative">
                            <Bell size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] rounded-full font-bold flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Уведомления</span>
                            {unreadCount > 0 && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                {unreadCount} непрочитан{unreadCount === 1 ? 'ное' : unreadCount < 5 ? 'ных' : 'ных'}
                              </p>
                            )}
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors rotate-[-90deg]" />
                        </button>
                        
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
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-lg mt-2 p-4 shadow-xl border border-gray-200 dark:border-gray-800 max-h-[70vh] overflow-y-auto"
              >
                {/* Mobile Search Input - Simplified */}
                <div className="mb-4">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                    if (input.value.trim()) {
                      router.push(`/search?q=${encodeURIComponent(input.value.trim())}`);
                      setIsOpen(false);
                    }
                  }} className="relative">
                    <input
                      type="text"
                      placeholder="Поиск..."
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600"
                    >
                      <SearchIcon size={20} />
                    </button>
                  </form>
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
                        className="block py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                        onClick={closeMobileMenu}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  
                  {/* Mobile User Links */}
                  {user ? (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                        {/* Mobile profile avatar */}
                        <div className="flex items-center gap-3 py-2 mb-2">
                          {(user.avatar || user.image) ? (
                            <Image 
                              src={user.avatar || user.image} 
                              alt="Avatar" 
                              width={36}
                              height={36}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                              {user?.name?.[0] || user?.email?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{user?.name || user?.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                        <Link href="/profile" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium" onClick={closeMobileMenu}>Мой профиль</Link>
                        <Link href="/orders" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium" onClick={closeMobileMenu}>Мои заказы</Link>
                        <Link href="/favorites" className="block py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium" onClick={closeMobileMenu}>Избранное</Link>
                        <button onClick={() => { logout(); closeMobileMenu(); }} className="block w-full text-left py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">Выйти</button>
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

      {/* Notifications Modal */}
      <AnimatePresence>
        {isNotificationsModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] z-[70]"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Уведомления</h2>
                        {unreadCount > 0 && (
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {unreadCount} непрочитан{unreadCount === 1 ? 'ное' : unreadCount < 5 ? 'ных' : 'ных'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Очистить все
                        </button>
                      )}
                      <button
                        onClick={() => setIsNotificationsModalOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        <Bell size={36} className="text-purple-400 dark:text-purple-500" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">Нет уведомлений</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Все прочитано ✓</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.map((notification) => (
                        <motion.button
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                          }}
                          className={`w-full px-6 py-4 text-left transition-all group ${
                            !notification.isRead 
                              ? 'bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 hover:from-purple-100/70 hover:to-pink-100/70 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {!notification.isRead && (
                              <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mt-1.5 flex-shrink-0 animate-pulse shadow-lg shadow-purple-500/50"></span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <p className={`font-semibold ${
                                  !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium flex-shrink-0">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {new Date(notification.createdAt).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {!notification.isRead && (
                                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Нажмите чтобы отметить как прочитанное
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Нажмите на уведомление чтобы отметить как прочитанное
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}