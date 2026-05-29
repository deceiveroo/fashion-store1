'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, Search as SearchIcon, Plus, LogOut, ChevronDown, Package, Heart, Bell, CheckCheck, Trash2, Sparkles } from 'lucide-react';
import SearchComponent from './SearchNew';
import Cart from './Cart';
import ThemeToggle from './ThemeToggle';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';

const navigation = [
  { name: 'Новинки', href: '/new' },
  { name: 'Коллекции', href: '/collections' },
  { name: 'Мужское', href: '/men' },
  { name: 'Женское', href: '/women' },
  { name: 'О нас', href: '/company/about' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { user, isLoading } = useAuth();
  const { state: cart } = useCart();
  const { open: openAuth } = useAuthModal();

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

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/notifications/${id}/read`, {
            method: 'POST',
            credentials: 'include',
          })
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    // Показываем красивое подтверждение
    setShowClearConfirm(true);
  };

  const confirmClearNotifications = async () => {
    setShowClearConfirm(false);
    
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
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? 'border-b border-[var(--fc-glass-border)] bg-[var(--fc-surface)] shadow-[0_8px_30px_rgba(17,12,46,0.08)]'
            : 'border-b border-transparent bg-white/55 dark:bg-[#191926]/55'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-[height] duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/" aria-label="ELEVATE — на главную" className="group relative inline-flex items-center">
                <span className="elevate-wordmark text-xl font-black uppercase leading-none tracking-[0.28em] sm:text-2xl">
                  ELEVATE
                </span>
                {/* тонкая градиентная подчёркивающая засечка, растёт на hover */}
                <span className="absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-purple-500/10 dark:bg-purple-400/15"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {item.name}
                  </Link>
                );
              })}
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
                          {/* Pulsing Avatar Animation */}
                          <div className={unreadCount > 0 ? 'animate-pulse' : ''}>
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10">
                              <Image 
                                src={user.avatar || user.image || ''} 
                                alt="Avatar" 
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                                priority
                              />
                            </div>
                          </div>
                          {/* Small notification dot */}
                          {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-black dark:bg-white rounded-full border-2 border-white dark:border-gray-900 shadow-md"></span>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Pulsing Avatar Animation */}
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm ${
                            unreadCount > 0 ? 'animate-pulse' : ''
                          }`}>
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
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                        data-user-menu
                        className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] shadow-2xl backdrop-blur-2xl z-[70]"
                      >
                        {/* Шапка профиля с акцентным градиентом */}
                        <div className="relative px-4 py-4 text-white" style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}>
                          <div className="flex items-center gap-3">
                            {(user.avatar || user.image) ? (
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40">
                                <Image src={user.avatar || user.image || ''} alt="Avatar" width={44} height={44} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                                {user?.name?.[0] || user?.email?.[0] || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold leading-tight">
                                {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Пользователь'}
                              </p>
                              <p className="truncate text-xs text-white/80">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--fc-surface-elevated)] hover:text-[var(--foreground)]"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User size={18} className="text-[#8b7cf6]" />
                            <span>Профиль</span>
                          </Link>
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--fc-surface-elevated)] hover:text-[var(--foreground)]"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Package size={18} className="text-[#8b7cf6]" />
                            <span>Мои заказы</span>
                          </Link>
                          <Link
                            href="/favorites"
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--fc-surface-elevated)] hover:text-[var(--foreground)]"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Heart size={18} className="text-[#8b7cf6]" />
                            <span>Избранное</span>
                          </Link>

                          {/* Уведомления */}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsNotificationsModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--fc-surface-elevated)] hover:text-[var(--foreground)]"
                          >
                            <span className="relative">
                              <Bell size={18} className="text-[#8b7cf6]" />
                              {unreadCount > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </span>
                            <span className="flex-1">Уведомления</span>
                            {unreadCount > 0 && (
                              <span className="text-xs font-semibold text-[#8b7cf6]">{unreadCount}</span>
                            )}
                          </button>
                        </div>

                        <div className="border-t border-[var(--fc-glass-border)] p-2">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
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
                <div className="hidden md:flex items-center"> {/* Показываем только на десктопе */}
                  {/* Login / Register (единая кнопка → модалка) */}
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openAuth('signin')}
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-shadow hover:shadow-xl hover:shadow-purple-500/40"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                    <User size={16} />
                    Войти
                  </motion.button>
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
                            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                              <Image 
                                src={user.avatar || user.image || ''} 
                                alt="Avatar" 
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            </div>
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
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                        <button
                          onClick={() => { openAuth('signin'); closeMobileMenu(); }}
                          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-semibold text-white shadow-lg"
                        >
                          <User size={16} />
                          Войти или зарегистрироваться
                        </button>
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
              <div className="bg-[var(--fc-surface)] backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--fc-glass-border)] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}>
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">Уведомления</h2>
                        {unreadCount > 0 && (
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {unreadCount} непрочитан{unreadCount === 1 ? 'ное' : unreadCount < 5 ? 'ных' : 'ных'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Прочитать все
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Очистить
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
                      <div className="w-20 h-20 mx-auto mb-4 bg-[#faf9f6] dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
                        <Bell size={36} className="text-gray-400 dark:text-neutral-500" />
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
                              ? 'bg-[#8b7cf6]/[0.08] hover:bg-[#8b7cf6]/[0.14]'
                              : 'hover:bg-[var(--fc-surface-elevated)]'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {!notification.isRead && (
                              <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}></span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <p className={`font-semibold ${
                                  !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="text-[9px] px-2.5 py-0.5 rounded-full text-white font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}>
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
                                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="px-6 py-3 border-t border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)]">
                    <p className="text-xs text-center text-[var(--text-secondary)]">
                      Нажмите на уведомление чтобы отметить как прочитанное
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            
            {/* Confirmation Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[90] px-4"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Icon Header */}
                <div className="px-6 pt-8 pb-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Очистить все уведомления?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Это действие нельзя отменить. Все {notifications.length} уведомлени{notifications.length === 1 ? 'е' : notifications.length < 5 ? 'я' : 'й'} будут удалены навсегда.
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmClearNotifications}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium hover:from-red-700 hover:to-orange-700 transition-all shadow-lg shadow-red-500/30"
                  >
                    Да, очистить
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}