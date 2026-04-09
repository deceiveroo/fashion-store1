'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Camera, Mail, Phone, MapPin, Edit3, ChevronDown, LogOut, 
  Package, Heart, User, CreditCard, Bell, Shield, FileText, 
  Download, Trash2, X, Plus, Monitor, Clock, Star, AlertTriangle, Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

type Section = 'personal' | 'security' | 'payments' | 'notifications' | 'orders' | 'wishlist' | 'privacy';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  last4: string;
  brand: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
}

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
  };
  image?: string;
}

interface UserSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const { update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedSections, setExpandedSections] = useState<Set<Section>>(new Set(['personal']));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Real data states
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [notifications, setNotifications] = useState<any>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Payment form
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  // Export/Delete
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/signin'); return; }
    loadAllData();
  }, [user, authLoading]);

  const loadAllData = async () => {
    setIsLoadingData(true);
    await Promise.all([
      loadProfile(),
      loadOrders(),
      loadWishlist(),
      loadPaymentMethods(),
      loadSessions(),
      loadNotificationSettings(),
    ]);
    setIsLoadingData(false);
  };

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          avatar: data.avatar || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadWishlist = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile/wishlist', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      setWishlist([]);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile/payments', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.methods || []);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile/sessions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.settings || {});
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      setNotifications({});
    }
  };

  const toggleSection = (section: Section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Пожалуйста, выберите изображение'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл слишком большой (макс. 5MB)'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const oldAvatar = formData.avatar || user?.image;
      if (oldAvatar && oldAvatar.includes('supabase')) fd.append('oldUrl', oldAvatar);
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Ошибка загрузки'); }
      const data = await res.json();
      setFormData(prev => ({ ...prev, avatar: data.url }));
      await saveProfile({ avatar: data.url });
      await refreshUser();
      if (updateSession) await updateSession();
      toast.success('Аватар обновлен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async (updates: any) => {
    const token = localStorage.getItem('auth-token');
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) { const error = await res.json(); throw new Error(error.message || 'Ошибка сохранения'); }
    return res.json();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      });
      await refreshUser();
      if (updateSession) await updateSession();
      toast.success('Профиль успешно обновлен');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.number || !newCard.holderName || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cardNumber: newCard.number.replace(/\s/g, ''),
          holderName: newCard.holderName,
          expiryMonth: newCard.expiryMonth,
          expiryYear: newCard.expiryYear,
          cvv: newCard.cvv,
          isDefault: paymentMethods.length === 0,
        }),
      });

      if (!res.ok) throw new Error('Ошибка добавления карты');

      await loadPaymentMethods();
      setShowAddCard(false);
      setNewCard({ number: '', holderName: '', expiryMonth: '', expiryYear: '', cvv: '' });
      toast.success('Карта добавлена');
    } catch (error) {
      toast.error('Ошибка при добавлении карты');
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch(`/api/profile/payments?id=${methodId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadPaymentMethods();
      toast.success('Способ оплаты удален');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  const handleSetDefaultPayment = async (methodId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch('/api/profile/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ methodId, isDefault: true }),
      });
      await loadPaymentMethods();
      toast.success('Способ оплаты по умолчанию изменен');
    } catch (error) {
      toast.error('Ошибка при обновлении');
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch(`/api/profile/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadWishlist();
      toast.success('Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch(`/api/profile/sessions?id=${sessionId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadSessions();
      toast.success('Сессия завершена');
    } catch (error) {
      toast.error('Ошибка при завершении сессии');
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Данные экспортированы');
    } catch (error) {
      toast.error('Ошибка при экспорте');
    } finally {
      setIsExporting(false);
    }
  };

  const getInitials = () => `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const getBrandIcon = (brand: string) => {
    const icons: Record<string, string> = {
      'Visa': '💳',
      'Mastercard': '💳',
      'Mir': '💳',
      'YooMoney': '💰',
      'QIWI': '💰',
    };
    return icons[brand] || '💳';
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'Visa': 'from-blue-500 to-blue-600',
      'Mastercard': 'from-orange-500 to-red-500',
      'Mir': 'from-green-500 to-emerald-600',
      'YooMoney': 'from-purple-500 to-purple-600',
      'QIWI': 'from-orange-500 to-yellow-500',
    };
    return colors[brand] || 'from-gray-500 to-gray-600';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-16">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const sections = [
    { id: 'personal' as Section, icon: User, title: 'Личная информация', count: null },
    { id: 'orders' as Section, icon: Package, title: 'Мои заказы', count: orders.length },
    { id: 'wishlist' as Section, icon: Heart, title: 'Избранное', count: wishlist.length },
    { id: 'payments' as Section, icon: CreditCard, title: 'Способы оплаты', count: paymentMethods.length },
    { id: 'security' as Section, icon: Shield, title: 'Безопасность', count: sessions.length },
    { id: 'notifications' as Section, icon: Bell, title: 'Уведомления', count: null },
    { id: 'privacy' as Section, icon: FileText, title: 'Конфиденциальность', count: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Мой Профиль
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Управляйте вашими данными и настройками</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-purple-100 dark:border-purple-900/50"
        >
          <div className="flex items-center gap-6 flex-wrap">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 overflow-hidden flex items-center justify-center cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {formData.avatar ? (
                <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{getInitials()}</span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {isUploading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full" />
                ) : (
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </motion.div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

            {/* User Info */}
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{formData.email}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                  Активен
                </span>
                {orders.length > 0 && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                    {orders.length} заказов
                  </span>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-100 dark:border-purple-900/50 overflow-hidden"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <Icon className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h3>
                      {section.count !== null && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{section.count} элементов</p>
                      )}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={24} className="text-gray-400" />
                  </motion.div>
                </button>

                {/* Section Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-purple-100 dark:border-purple-900/50"
                    >
                      <div className="p-6">
                        {/* Personal Info Section */}
                        {section.id === 'personal' && (
                          <div className="space-y-4">
                            <div className="flex justify-end mb-4">
                              {!isEditing ? (
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                                >
                                  <Edit3 size={16} />
                                  Редактировать
                                </button>
                              ) : null}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Имя</label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                ) : (
                                  <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-900 dark:text-white">{formData.firstName || '—'}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Фамилия</label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                ) : (
                                  <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-900 dark:text-white">{formData.lastName || '—'}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                  <Mail size={16} className="text-gray-500" />
                                  <span className="text-gray-900 dark:text-white">{formData.email}</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
                                {isEditing ? (
                                  <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="+7 (___) ___-__-__"
                                  />
                                ) : (
                                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <Phone size={16} className="text-gray-500" />
                                    <span className="text-gray-900 dark:text-white">{formData.phone || 'Не указан'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Адрес</label>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={formData.address}
                                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Город, улица, дом, квартира"
                                />
                              ) : (
                                <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                  <MapPin size={16} className="text-gray-500 mt-1" />
                                  <span className="text-gray-900 dark:text-white">{formData.address || 'Адрес не указан'}</span>
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader className="animate-spin" size={18} />
                                      Сохранение...
                                    </>
                                  ) : (
                                    'Сохранить'
                                  )}
                                </button>
                                <button
                                  onClick={() => { setIsEditing(false); loadProfile(); }}
                                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                >
                                  Отмена
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Orders Section */}
                        {section.id === 'orders' && (
                          <div>
                            {orders.length === 0 ? (
                              <div className="text-center py-8">
                                <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 mb-4">У вас пока нет заказов</p>
                                <Link
                                  href="/products"
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                                >
                                  Начать покупки
                                </Link>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {orders.slice(0, 5).map((order) => (
                                  <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Заказ #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                                        </p>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        {order.status === 'delivered' ? 'Доставлен' :
                                         order.status === 'cancelled' ? 'Отменен' :
                                         order.status === 'shipped' ? 'В пути' :
                                         order.status === 'processing' ? 'Обрабатывается' : 'Ожидает'}
                                      </span>
                                    </div>
                                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                      {parseFloat(order.total).toLocaleString('ru-RU')} ₽
                                    </p>
                                  </div>
                                ))}
                                {orders.length > 5 && (
                                  <Link
                                    href="/orders"
                                    className="block text-center py-3 text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                  >
                                    Показать все заказы ({orders.length})
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Wishlist Section */}
                        {section.id === 'wishlist' && (
                          <div>
                            {wishlist.length === 0 ? (
                              <div className="text-center py-8">
                                <Heart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">Список избранного пуст</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {wishlist.map((item) => (
                                  <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex gap-4">
                                    {item.image && (
                                      <img src={item.image} alt={item.product.name} className="w-20 h-20 object-cover rounded-lg" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.product.name}</h4>
                                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">
                                        {item.product.price.toLocaleString('ru-RU')} ₽
                                      </p>
                                      <button
                                        onClick={() => handleRemoveFromWishlist(item.productId)}
                                        className="text-sm text-red-600 hover:underline"
                                      >
                                        Удалить
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Methods Section */}
                        {section.id === 'payments' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Сохраненные карты</h4>
                              <button
                                onClick={() => setShowAddCard(!showAddCard)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                <Plus size={16} />
                                Добавить
                              </button>
                            </div>

                            {showAddCard && (
                              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                                <input
                                  type="text"
                                  placeholder="Номер карты"
                                  value={newCard.number}
                                  onChange={(e) => setNewCard({ ...newCard, number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                />
                                <input
                                  type="text"
                                  placeholder="Имя владельца"
                                  value={newCard.holderName}
                                  onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value.toUpperCase() })}
                                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="ММ"
                                    value={newCard.expiryMonth}
                                    onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                  />
                                  <input
                                    type="text"
                                    placeholder="ГГГГ"
                                    value={newCard.expiryYear}
                                    onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                  />
                                  <input
                                    type="password"
                                    placeholder="CVV"
                                    value={newCard.cvv}
                                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={handleAddCard} className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                    Добавить
                                  </button>
                                  <button onClick={() => setShowAddCard(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            )}

                            {paymentMethods.length === 0 ? (
                              <p className="text-center text-gray-600 dark:text-gray-400 py-4">Нет сохраненных способов оплаты</p>
                            ) : (
                              <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                  <div key={method.id} className={`p-4 rounded-xl bg-gradient-to-br ${getBrandColor(method.brand)} text-white relative`}>
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-2xl">{getBrandIcon(method.brand)}</span>
                                        <span className="font-semibold">{method.brand}</span>
                                        {method.isDefault && (
                                          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs flex items-center gap-1">
                                            <Star size={10} fill="currentColor" />
                                            По умолчанию
                                          </span>
                                        )}
                                      </div>
                                      <button onClick={() => handleRemovePaymentMethod(method.id)} className="p-1 hover:bg-white/20 rounded">
                                        <X size={16} />
                                      </button>
                                    </div>
                                    <p className="text-xl font-mono mb-2">•••• •••• •••• {method.last4}</p>
                                    <div className="flex justify-between items-end">
                                      <p className="text-sm">{method.holderName}</p>
                                      {method.expiryMonth && method.expiryYear && (
                                        <p className="text-sm">{String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}</p>
                                      )}
                                    </div>
                                    {!method.isDefault && (
                                      <button
                                        onClick={() => handleSetDefaultPayment(method.id)}
                                        className="mt-2 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
                                      >
                                        Сделать основным
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Security Section */}
                        {section.id === 'security' && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Активные сессии</h4>
                            {sessions.length === 0 ? (
                              <p className="text-center text-gray-600 dark:text-gray-400 py-4">Нет активных сессий</p>
                            ) : (
                              <div className="space-y-2">
                                {sessions.map((session) => (
                                  <div key={session.id} className={`p-3 rounded-lg ${session.isCurrent ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <Monitor size={14} />
                                          <p className="text-sm font-medium">{session.device}</p>
                                          {session.isCurrent && <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Текущая</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                          <span>{session.location}</span>
                                          <span>{session.ip}</span>
                                          <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {session.lastActive}
                                          </span>
                                        </div>
                                      </div>
                                      {!session.isCurrent && (
                                        <button onClick={() => handleTerminateSession(session.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
                                          <X size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notifications Section */}
                        {section.id === 'notifications' && (
                          <div className="space-y-6">
                            {isLoadingData ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader className="animate-spin text-purple-600" size={32} />
                              </div>
                            ) : (
                              <>
                                {/* Orders Notifications */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Package size={18} className="text-purple-600" />
                                    Заказы
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.ordersEmail || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, ordersEmail: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.ordersPush || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, ordersPush: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Bell size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.ordersSms || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, ordersSms: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>

                                {/* Promotions Notifications */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Star size={18} className="text-yellow-600" />
                                    Акции и скидки
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.promotionsEmail || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, promotionsEmail: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.promotionsPush || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, promotionsPush: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Bell size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.promotionsSms || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, promotionsSms: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>

                                {/* Wishlist Notifications */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Heart size={18} className="text-red-600" />
                                    Избранное
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.wishlistEmail || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, wishlistEmail: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.wishlistPush || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, wishlistPush: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Bell size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.wishlistSms || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, wishlistSms: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>

                                {/* Security Notifications */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield size={18} className="text-blue-600" />
                                    Безопасность
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.securityEmail || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, securityEmail: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.securityPush || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, securityPush: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Bell size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                                      </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={notifications.securitySms || false}
                                        onChange={(e) => {
                                          const newSettings = { ...notifications, securitySms: e.target.checked };
                                          setNotifications(newSettings);
                                          fetch('/api/profile/notifications', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
                                            },
                                            body: JSON.stringify(newSettings),
                                          });
                                        }}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Privacy Section */}
                        {section.id === 'privacy' && (
                          <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Экспорт данных (GDPR)</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Скачайте все ваши данные в формате JSON
                              </p>
                              <button
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isExporting ? (
                                  <>
                                    <Loader className="animate-spin" size={18} />
                                    Экспорт...
                                  </>
                                ) : (
                                  <>
                                    <Download size={18} />
                                    Экспортировать данные
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-500" />
                                Удаление аккаунта
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Это действие необратимо. Все данные будут удалены.
                              </p>
                              {!showDeleteConfirm ? (
                                <button
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                  <Trash2 size={18} />
                                  Удалить аккаунт
                                </button>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                    Введите <span className="font-mono font-bold">УДАЛИТЬ</span> для подтверждения
                                  </p>
                                  <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Введите УДАЛИТЬ"
                                    className="w-full px-4 py-2 border-2 border-red-300 dark:border-red-700 rounded-lg text-center font-mono"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      disabled={deleteConfirmText !== 'УДАЛИТЬ'}
                                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                                    >
                                      Подтвердить
                                    </button>
                                    <button
                                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                                    >
                                      Отмена
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
