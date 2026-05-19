'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Camera, Mail, Phone, MapPin, Edit3, ChevronDown, LogOut, 
  Package, Heart, User, CreditCard, Bell, Shield, FileText, 
  Download, Trash2, X, Plus, Monitor, Clock, Star, AlertTriangle, Loader,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import GamificationProfileWidget from '@/components/gamification/GamificationProfileWidget';
import NotificationsPanel from '@/components/profile/NotificationsPanel';

interface NotificationSettings {
  ordersEmail?: boolean;
  ordersPush?: boolean;
  ordersSms?: boolean;
  promotionsEmail?: boolean;
  promotionsPush?: boolean;
  promotionsSms?: boolean;
  wishlistEmail?: boolean;
  wishlistPush?: boolean;
  wishlistSms?: boolean;
}

type Section = 'personal' | 'security' | 'payments' | 'notifications' | 'orders' | 'wishlist' | 'privacy' | 'coupons';

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

interface OrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

interface OrderRecipient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

interface Order {
  id: string;
  userId: string;
  total: number;
  discount: number;
  deliveryPrice: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  recipient?: OrderRecipient;
  comment?: string;
  items?: OrderItem[];
}

interface UserSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface UserCoupon {
  id: string;
  couponId: string;
  orderId?: string;
  discountAmount: string;
  usedAt: string;
  couponCode: string;
  couponDiscount: number;
  couponType: string;
  couponActive: boolean;
  couponExpiresAt?: string;
  isExpired: boolean;
  isValid: boolean;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const { update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<Section>('personal');

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({});
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
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

  // Phone mask formatter
  const formatPhone = (value: string) => {
    // Удаляем все нецифровые символы
    const digits = value.replace(/\D/g, '');
    
    // Если нет цифр, возвращаем пустую строку
    if (!digits) return '';
    
    // Первая цифра должна быть 7 или 8, заменяем на 7
    let cleanDigits = digits;
    if (cleanDigits[0] === '8') {
      cleanDigits = '7' + cleanDigits.substring(1);
    }
    if (cleanDigits[0] !== '7') {
      cleanDigits = '7' + cleanDigits;
    }
    
    // Ограничиваем до 11 цифр
    cleanDigits = cleanDigits.substring(0, 11);
    
    // Форматируем
    let formatted = '+7';
    if (cleanDigits.length > 1) {
      formatted += ' (' + cleanDigits.substring(1, 4);
    }
    if (cleanDigits.length >= 4) {
      formatted += ') ' + cleanDigits.substring(4, 7);
    }
    if (cleanDigits.length >= 7) {
      formatted += '-' + cleanDigits.substring(7, 9);
    }
    if (cleanDigits.length >= 9) {
      formatted += '-' + cleanDigits.substring(9, 11);
    }
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const oldValue = formData.phone;
    const newValue = formatPhone(input.value);
    
    // Вычисляем позицию курсора
    const cursorPos = input.selectionStart || 0;
    const oldLength = oldValue.length;
    const newLength = newValue.length;
    
    setFormData({ ...formData, phone: newValue });
    
    // Восстанавливаем позицию курсора с учётом изменений
    setTimeout(() => {
      if (input && document.activeElement === input) {
        let newCursorPos = cursorPos;
        
        // Если длина увеличилась (ввод), ставим курсор в конец
        if (newLength > oldLength) {
          newCursorPos = newLength;
        }
        // Если длина уменьшилась (удаление)
        else if (newLength < oldLength && newLength > 0) {
          // Проверяем символ на текущей позиции курсора
          const charAtCursor = newValue[newCursorPos - 1];
          
          // Если перед курсором спецсимвол, перескакиваем через него
          if (charAtCursor && [' ', '(', ')', '-'].includes(charAtCursor)) {
            newCursorPos = Math.max(3, newCursorPos - 1);
          }
        }
        
        // Ограничиваем позицию в допустимых пределах
        newCursorPos = Math.min(newCursorPos, newValue.length);
        
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

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
      loadCoupons(),
    ]);
    setIsLoadingData(false);
    
    // Check achievements after loading profile (in background)
    checkAchievements();
  };

  const loadProfile = async () => {
    try {
      // Используем credentials для аутентификации через cookies
      const res = await fetch('/api/profile', {
        credentials: 'include',
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
      } else if (res.status === 401) {
        // Не авторизован - перенаправляем на вход
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // API returns array directly, not { orders: [] }
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    }
  };

  const loadWishlist = async () => {
    try {
      const res = await fetch('/api/profile/wishlist', {
        credentials: 'include',
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

  const checkAchievements = async () => {
    try {
      // Check all achievements in background
      const res = await fetch('/api/gamification/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.unlocked && data.unlocked.length > 0) {
          console.log(`🏆 Unlocked ${data.count} achievements:`, data.unlocked);
          // Show toast for each unlocked achievement
          data.unlocked.forEach((achievement: any) => {
            if (achievement.achievement) {
              toast.success(
                `🎉 Достижение разблокировано: ${achievement.achievement.name}! +${achievement.achievement.xp} XP, +${achievement.achievement.coins} монет`,
                { duration: 5000 }
              );
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/profile/payments', {
        credentials: 'include',
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
      const res = await fetch('/api/profile/sessions', {
        credentials: 'include',
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
      const res = await fetch('/api/profile/notifications', {
        credentials: 'include',
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

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/profile/coupons', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
      setCoupons([]);
    }
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
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Ошибка загрузки'); }
      const data = await res.json();
      setFormData(prev => ({ ...prev, avatar: data.url }));
      await saveProfile({ avatar: data.url });
      await refreshUser();
      toast.success('Аватар обновлен');
      
      // Check avatar achievement
      fetch('/api/gamification/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'profile_complete' }),
        credentials: 'include'
      }).catch(err => console.error('Achievement check failed:', err));
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async (updates: any) => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
      
      // Check profile completion achievements
      fetch('/api/gamification/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'profile_complete' }),
        credentials: 'include'
      }).catch(err => console.error('Achievement check failed:', err));
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
    { id: 'coupons' as Section, icon: Ticket, title: 'Мои промокоды', count: coupons.length },
    { id: 'payments' as Section, icon: CreditCard, title: 'Способы оплаты', count: paymentMethods.length },
    { id: 'security' as Section, icon: Shield, title: 'Безопасность', count: sessions.length },
    { id: 'notifications' as Section, icon: Bell, title: 'Уведомления', count: null },
    { id: 'privacy' as Section, icon: FileText, title: 'Конфиденциальность', count: null },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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

        {/* Gamification Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GamificationProfileWidget />
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 mb-6 border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-6 flex-wrap">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 overflow-hidden flex items-center justify-center cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.firstName || 'Аватар'}
                  className="w-full h-full object-cover"
                  onError={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                />
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

        <nav className="flex gap-2 overflow-x-auto mb-4 pb-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={`nav-${section.id}`}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon size={15} />
                {section.title}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = activeSection === section.id;
            if (!isExpanded) return null;

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
                  onClick={() => setActiveSection(section.id)}
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
                                    onChange={handlePhoneChange}
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
                                  href="/collections"
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
                                      {order.total.toLocaleString('ru-RU')} ₽
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

                        {/* Coupons Section */}
                        {section.id === 'coupons' && (
                          <div className="space-y-4">
                            {isLoadingData ? (
                              <div className="text-center py-8">
                                <Loader className="animate-spin mx-auto text-purple-600 mb-4" size={48} />
                                <p className="text-gray-600 dark:text-gray-400">Загрузка промокодов...</p>
                              </div>
                            ) : coupons.length === 0 ? (
                              <div className="text-center py-8">
                                <Ticket size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">У вас пока нет использованных промокодов</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Промокоды появятся здесь после использования при оформлении заказа</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {coupons.map((coupon) => (
                                  <motion.div
                                    key={coupon.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                      coupon.isValid
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                                        : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                          coupon.isValid
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-400 text-white'
                                        }`}>
                                          <Ticket size={20} />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-gray-900 dark:text-white text-lg font-mono">
                                            {coupon.couponCode}
                                          </h4>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Скидка: {coupon.couponType === 'percent' ? `${coupon.couponDiscount}%` : `${coupon.couponDiscount} ₽`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          coupon.isValid
                                            ? 'bg-green-500 text-white'
                                            : coupon.isExpired
                                              ? 'bg-red-500 text-white'
                                              : 'bg-gray-500 text-white'
                                        }`}>
                                          {coupon.isValid ? '✓ Активен' : coupon.isExpired ? '✗ Истек' : '✗ Неактивен'}
                                        </span>
                                        {coupon.orderId && (
                                          <Link
                                            href={`/orders/${coupon.orderId}`}
                                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                                          >
                                            Перейти к заказу →
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Сэкономлено:</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                          {parseFloat(coupon.discountAmount).toLocaleString('ru-RU')} ₽
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Clock size={14} />
                                        <span>{new Date(coupon.usedAt).toLocaleDateString('ru-RU')}</span>
                                      </div>
                                    </div>

                                    {coupon.couponExpiresAt && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                          Срок действия:{' '}
                                          <span className={coupon.isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                                            {new Date(coupon.couponExpiresAt).toLocaleDateString('ru-RU')}
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                  </motion.div>
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
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-gray-900 dark:text-white">Активные сессии</h4>
                            </div>
                            
                            {isLoadingData ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader className="animate-spin text-purple-600" size={32} />
                              </div>
                            ) : sessions.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <Monitor size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">Нет активных сессий</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {sessions.map((session) => {
                                  const isMobile = session.device.toLowerCase().includes('mobile') || session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android');
                                  const isTablet = session.device.toLowerCase().includes('ipad') || session.device.toLowerCase().includes('tablet');
                                  
                                  return (
                                    <motion.div
                                      key={session.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`p-4 rounded-xl border-2 transition-all ${
                                        session.isCurrent 
                                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 shadow-lg shadow-green-100 dark:shadow-green-900/20' 
                                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                          {/* Device Icon and Name */}
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg ${
                                              session.isCurrent 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}>
                                              {isMobile ? <Phone size={20} /> : isTablet ? <Monitor size={20} /> : <Monitor size={20} />}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-gray-900 dark:text-white">{session.device}</p>
                                              {session.isCurrent && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                                                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                  Текущая сессия
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Session Details */}
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                              <MapPin size={14} className="text-purple-500" />
                                              <span>{session.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                              <Shield size={14} className="text-blue-500" />
                                              <span className="font-mono text-xs">{session.ip}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2 md:col-span-1">
                                              <Clock size={14} className="text-orange-500" />
                                              <span>{session.lastActive}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            )}


                            {/* Security Tips */}
                            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                              <h5 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <Shield size={16} />
                                Советы по безопасности
                              </h5>
                              <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1 list-disc list-inside">
                                <li>Регулярно проверяйте активные сессии</li>
                                <li>Используйте надежные пароли</li>
                                <li>Включите двухфакторную аутентификацию</li>
                                <li>Не входите с чужих устройств</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Notifications Section */}
                        {section.id === 'notifications' && (
                          <NotificationsPanel 
                            notifications={notifications} 
                            setNotifications={setNotifications} 
                          />
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
