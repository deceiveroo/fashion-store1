// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Store, CreditCard, Shield, Zap, Gift, Sparkles, ShoppingBag, MapPin, Clock, Wallet, User, Package, ChevronDown, Coins, Check, ArrowRight, ArrowLeft, Star, Lock, Percent, TrendingUp, Heart, BadgeCheck, Navigation, Phone, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import StorePickerModal from '@/components/checkout/StorePickerModal';
import FuturisticProgress from '@/components/checkout/FuturisticProgress';
import AmbientBackground from '@/components/checkout/AmbientBackground';
import type { StoreItem } from '@/lib/stores/types';
import { getRecentStores, pushRecentStore } from '@/lib/stores/recent';

export default function CheckoutPage() {
  const { state: cart, clearCart } = useCart();
  const { user, addOrder, updateOrderStatus } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'individual' | 'legal'>('individual');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier' | 'express'>('pickup');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(false);
  const [recentStores, setRecentStores] = useState<StoreItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [cryptoAddress, setCryptoAddress] = useState<string | null>(null);
  const [loadingCryptoAddress, setLoadingCryptoAddress] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    comment: ''
  });

  // Payment form data
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCVV: '',
    sbpPhone: user?.phone || ''
  });

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    type: 'percent' | 'fixed';
    discountAmount: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Calculate finalTotal early in the component
  const getDiscount = () => {
    let discount = 0;
    // Автоматические скидки
    if (cart.total > 5000) discount = 500;
    else if (cart.total > 3000) discount = 300;
    else if (cart.total > 1000) discount = 100;
    
    // Добавляем скидку от промокода
    if (appliedCoupon) {
      discount += appliedCoupon.discountAmount;
    }
    
    return discount;
  };

  const getDeliveryPrice = () => {
    if (deliveryMethod === 'express') return 490;
    if (deliveryMethod === 'courier' && cart.total < 2000) return 200;
    return 0;
  };

  const finalTotal = Math.max(0, cart.total - getDiscount() + getDeliveryPrice());
  
  // Validate promo code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Введите промокод');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          orderTotal: cart.total
        })
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        toast.error(data.error || 'Неверный промокод');
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        id: data.coupon.id,
        code: data.coupon.code,
        discount: data.coupon.discount,
        type: data.coupon.type,
        discountAmount: data.discountAmount
      });
      
      toast.success(`✅ ${data.message}`);
      
      // Check coupon achievements (in background, don't block UI)
      if (user?.id) {
        fetch('/api/gamification/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'coupon_used' }),
          credentials: 'include'
        }).catch(err => console.error('Achievement check failed:', err));
      }
      setPromoCode('');
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Ошибка проверки промокода');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Промокод удалён');
  };
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<unknown> | null>(null);
  
  // Обновляем данные формы при изменении пользователя
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName || '',
        lastName: user.lastName || prev.lastName || '',
        phone: user.phone || prev.phone || '',
        email: user.email || prev.email || ''
      }));
      
      // Обновляем телефон для СБП
      if (user.phone) {
        setPaymentData(prev => ({
          ...prev,
          sbpPhone: user.phone || prev.sbpPhone
        }));
      }
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.phone, user?.email]);

  // Загружаем данные профиля при монтировании
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setFormData(prev => ({
              ...prev,
              firstName: data.profile.firstName || prev.firstName,
              lastName: data.profile.lastName || prev.lastName,
              phone: data.profile.phone || prev.phone,
              email: data.profile.email || prev.email,
              address: data.profile.address || prev.address
            }));
            
            if (data.profile.phone) {
              setPaymentData(prev => ({
                ...prev,
                sbpPhone: data.profile.phone
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    if (user) {
      loadProfile();
    }
  }, [user?.id]);

  // Загружаем список магазинов
  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then(data => {
        const loaded = Array.isArray(data) ? data : [];
        setStores(loaded);
        // Filter recents to only include stores that exist in the current list
        setRecentStores(getRecentStores().filter(r => loaded.some(s => s.id === r.id)));
      })
      .catch(err => console.error('Error loading stores:', err));
  }, []);

  const selectedStore = stores.find(s => s.id === selectedStoreId) || null;

  const handleStoreConfirm = (store: StoreItem) => {
    setSelectedStoreId(store.id);
    setRecentStores(pushRecentStore(store));
    setIsStorePickerOpen(false);
  };

  const steps = [
    { id: 1, name: 'Контакты', completed: currentStep > 1, icon: User, description: 'Ваши данные' },
    { id: 2, name: 'Доставка', completed: currentStep > 2, icon: Package, description: 'Способ получения' },
    { id: 3, name: 'Оплата', completed: currentStep > 3, icon: CreditCard, description: 'Способ оплаты' }
  ];

  const deliveryOptions = [
    {
      id: 'pickup',
      title: 'Самовывоз',
      icon: Store,
      description: 'Пункты выдачи и отделения Почты России',
      price: 'Бесплатно',
      time: '1-3 дня',
      details: 'Более 200 пунктов выдачи в вашем городе',
      badge: 'Популярно',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'courier',
      title: 'Курьером',
      icon: Truck,
      description: 'По адресу до двери',
      price: 'Бесплатно от 2000 ₽',
      time: '1-2 дня',
      details: 'Бесплатная доставка при заказе от 2000 ₽',
      badge: 'Выгодно',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'express',
      title: 'Экспресс',
      icon: Zap,
      description: 'Доставка за 2 часа',
      price: '490 ₽',
      time: '2 часа',
      details: 'В пределах города в течение 2 часа',
      badge: 'Быстро',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const paymentOptions = [
    {
      id: 'card',
      title: 'Банковская карта',
      icon: CreditCard,
      description: 'Visa, Mastercard, МИР',
      available: true,
      badge: 'Безопасно',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'sbp',
      title: 'СБП',
      icon: Wallet,
      description: 'Система Быстрых Платежей',
      available: true,
      badge: 'Мгновенно',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'crypto',
      title: 'Криптовалюта',
      icon: Coins,
      description: 'LTC, USDT TRC-20, TON, NOT',
      available: true,
      badge: 'Новое',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'cash',
      title: 'Наличными',
      icon: Wallet,
      description: 'При получении',
      available: deliveryMethod === 'courier' || deliveryMethod === 'express',
      color: 'from-gray-500 to-slate-500'
    },
    {
      id: 'installment',
      title: 'Рассрочка',
      icon: Shield,
      description: '0% на 4 месяца',
      available: cart.total > 3000,
      badge: '0%',
      color: 'from-yellow-500 to-amber-500'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Маска для телефона
    if (name === 'phone') {
      const formatted = formatPhone(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Форматирование телефона
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    
    let cleanDigits = digits;
    if (cleanDigits[0] === '8') {
      cleanDigits = '7' + cleanDigits.substring(1);
    }
    if (cleanDigits[0] !== '7') {
      cleanDigits = '7' + cleanDigits;
    }
    
    cleanDigits = cleanDigits.substring(0, 11);
    
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

  const handleDeliverySelect = (method: 'pickup' | 'courier' | 'express') => {
    setDeliveryMethod(method);
    if (method !== 'pickup') {
      setSelectedStoreId('');
    }
    setPaymentMethod('');
  };

  const handleNextStep = () => {
    if (currentStep === 2) {
      if (deliveryMethod === 'pickup' && !selectedStoreId) {
        toast.error('Выберите магазин для самовывоза');
        return;
      }
      if ((deliveryMethod === 'courier' || deliveryMethod === 'express') && !formData.address) {
        toast.error('Введите адрес доставки');
        return;
      }
      setCurrentStep(3);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Для оформления заказа необходимо войти в аккаунт');
      router.push('/auth/signin');
      return;
    }

    if (!paymentMethod) {
      toast.error('Пожалуйста, выберите способ оплаты');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email) {
      toast.error('Пожалуйста, заполните все обязательные контактные данные');
      return;
    }

    if (!deliveryMethod) {
      toast.error('Пожалуйста, выберите способ доставки');
      return;
    }

    if (deliveryMethod === 'pickup' && !selectedStoreId) {
      toast.error('Пожалуйста, выберите магазин для самовывоза');
      return;
    }

    if ((deliveryMethod === 'courier' || deliveryMethod === 'express') && !formData.address) {
      toast.error('Пожалуйста, введите адрес доставки');
      return;
    }

    setIsSubmitting(true);
    setPaymentProgress(0);

    const progressInterval = setInterval(() => {
      setPaymentProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const order = {
        items: cart.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
          size: item.size,
          color: item.color,
        })),
        total: finalTotal,
        discount: getDiscount(),
        deliveryPrice: getDeliveryPrice(),
        deliveryMethod,
        paymentMethod,
        recipient: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          address: deliveryMethod === 'pickup'
            ? (selectedStore ? `Самовывоз: ${selectedStore.name}, ${selectedStore.address}` : '')
            : formData.address
        },
        comment: formData.comment,
        couponId: appliedCoupon?.id // Pass coupon ID if applied
      };

      const createdOrder = await addOrder(order);
      setPaymentProgress(100);

      setShowConfetti(true);
      toast.success('Заказ успешно оформлен!');

      clearCart();
      if (user) {
        localStorage.removeItem(`cart_${user.id}`);
      }
      localStorage.removeItem('cart');

      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (error) {
      console.error('Failed to create order:', error);
      clearInterval(progressInterval);
      setPaymentProgress(0);
      if (error instanceof Error) {
        toast.error(`Ошибка при оформлении заказа: ${error.message}`);
      } else {
        toast.error('Ошибка при оформлении заказа. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
      clearInterval(progressInterval);
    }
  };

  // Если корзина пуста
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <ShoppingBag size={120} className="text-gray-300 dark:text-gray-700" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <Sparkles size={16} className="text-white" />
              </motion.div>
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
          >
            Корзина пуста
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 mb-8 text-lg"
          >
            Добавьте товары, чтобы начать оформление заказа
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              href="/collections" 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Sparkles size={20} />
              Начать покупки
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#faf9f6] dark:bg-[#0a0a0f] pt-24 pb-12 transition-colors">
      {/* Ambient Background */}
      <AmbientBackground currentStep={currentStep} />
      {/* Animated gradient orbs background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-violet-400/20 to-purple-600/20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl"
        />
      </div>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -20,
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  opacity: 1,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{
                  y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 20,
                  rotate: Math.random() * 720,
                  opacity: 0
                }}
                transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 0.5 }}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 8 + 4,
                  height: Math.random() * 8 + 4,
                  background: ['#8b7cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6366f1'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header - Dynamic based on step */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h1
                className="text-4xl md:text-5xl font-bold mb-3"
              >
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {currentStep === 1 && "Расскажите о себе"}
                  {currentStep === 2 && "Куда доставить?"}
                  {currentStep === 3 && "Последний шаг!"}
                </span>
              </motion.h1>

              <motion.p
                className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto"
              >
                {currentStep === 1 && "Заполните контактные данные для связи с вами"}
                {currentStep === 2 && "Выберите удобный способ получения заказа"}
                {currentStep === 3 && "Выберите способ оплаты и завершите оформление 🎉"}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Futuristic Progress */}
            <FuturisticProgress steps={steps} currentStep={currentStep} />

            {/* Step Content - Новый дизайн */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 shadow-2xl"
              >
                {/* Animated gradient background */}
                <motion.div
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
                  className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 opacity-50"
                  style={{ backgroundSize: '200% 200%' }}
                />

                <div className="relative p-8">
                  {/* Step 1: Contact Info */}
                  {currentStep === 1 && (
                    <div>
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-8"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/50"
                        >
                          <User size={32} className="text-white" />
                        </motion.div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Контактные данные
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400">Заполните информацию для связи</p>
                        </div>
                      </motion.div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="group"
                          >
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Имя *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-400"
                                placeholder="Введите имя"
                                required
                              />
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: formData.firstName ? 1 : 0 }}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                              >
                                <Check size={20} className="text-green-500" />
                              </motion.div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="group"
                          >
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Фамилия *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-400"
                                placeholder="Введите фамилию"
                                required
                              />
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: formData.lastName ? 1 : 0 }}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                              >
                                <Check size={20} className="text-green-500" />
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Телефон *
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-400"
                                placeholder="+7 (___) ___-__-__"
                                required
                              />
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: formData.phone ? 1 : 0 }}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                              >
                                <Check size={20} className="text-green-500" />
                              </motion.div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Email *
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all duration-300 text-gray-900 dark:text-white placeholder:text-gray-400"
                                placeholder="your@email.com"
                                required
                              />
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: formData.email ? 1 : 0 }}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                              >
                                <Check size={20} className="text-green-500" />
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Комментарий к заказу
                          </label>
                          <textarea
                            name="comment"
                            value={formData.comment}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all duration-300 resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                            placeholder="Укажите дополнительные пожелания"
                          />
                        </motion.div>
                      </div>

                      <div className="flex justify-end mt-8">
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentStep(2)}
                          className="flex items-center gap-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 transition-all"
                        >
                          Продолжить
                          <ArrowRight size={20} />
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {/* Step 2: Delivery */}
                  {currentStep === 2 && (
                    <div>
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-8"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/50"
                        >
                          <Package size={32} className="text-white" />
                        </motion.div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Способ доставки
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400">Выберите удобный вариант получения</p>
                        </div>
                      </motion.div>

                      <div className="space-y-4 mb-6">
                        {deliveryOptions.map((option, index) => {
                          const IconComponent = option.icon;
                          const isSelected = deliveryMethod === option.id;
                          return (
                            <motion.div
                              key={option.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              onClick={() => handleDeliverySelect(option.id as 'pickup' | 'courier' | 'express')}
                              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                                isSelected
                                  ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-500 shadow-lg shadow-violet-500/30'
                                  : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'
                              }`}
                            >
                              {/* Animated background on hover */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10"
                              />

                              <div className="relative flex items-center gap-4">
                                <motion.div
                                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 0.5 }}
                                  className={`p-4 rounded-xl ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/50'
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  }`}
                                >
                                  <IconComponent size={32} className={isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
                                </motion.div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{option.title}</h3>
                                    {option.badge && (
                                      <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full">
                                        {option.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{option.description}</p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                      <Clock size={16} />
                                      <span>{option.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-semibold text-violet-600 dark:text-violet-400">
                                      <span>{option.price}</span>
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="flex-shrink-0"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                                      <Check size={20} className="text-white" strokeWidth={3} />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Store Selection for Pickup */}
                      {deliveryMethod === 'pickup' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6"
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Магазин для самовывоза *
                          </label>

                          {!selectedStore ? (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setIsStorePickerOpen(true)}
                              className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-5 text-left transition-all hover:border-violet-500 hover:bg-violet-50 dark:border-violet-700 dark:bg-violet-900/10 dark:hover:bg-violet-900/20"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg transition-transform group-hover:scale-110">
                                <MapPin size={22} />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white">Выбрать магазин на карте</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {stores.length} магазинов · поиск по городу рядом с вами
                                </p>
                              </div>
                              <ArrowRight size={20} className="shrink-0 text-violet-500 transition-transform group-hover:translate-x-1" />
                            </motion.button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:border-violet-800 dark:from-violet-900/20 dark:to-purple-900/20"
                            >
                              <div className="flex items-start justify-between gap-3 p-5">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
                                    <Store size={20} />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold uppercase tracking-tight text-gray-900 dark:text-white">{selectedStore.name}</p>
                                      <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-600 dark:text-violet-400">
                                        <Star size={11} fill="currentColor" />
                                        <span className="text-xs font-semibold">{selectedStore.rating}</span>
                                      </span>
                                    </div>
                                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                      <MapPin size={15} className="shrink-0 text-violet-500" />{selectedStore.address}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-violet-500" />{selectedStore.hours}</span>
                                      {selectedStore.phone && (
                                        <a href={`tel:${selectedStore.phone}`} className="flex items-center gap-1.5 hover:text-violet-500"><Phone size={14} className="text-violet-500" />{selectedStore.phone}</a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsStorePickerOpen(true)}
                                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-300 bg-white/70 px-3 py-2 text-sm font-semibold text-violet-600 transition-colors hover:bg-white dark:border-violet-700 dark:bg-gray-800/60 dark:text-violet-400"
                                >
                                  <Pencil size={14} />
                                  <span className="hidden sm:inline">Изменить</span>
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {/* Recent stores quick-pick */}
                          {recentStores.length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <Navigation size={12} className="text-violet-500" /> Недавние
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {recentStores.map((store) => (
                                  <button
                                    key={store.id}
                                    type="button"
                                    onClick={() => handleStoreConfirm(store)}
                                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                                      selectedStoreId === store.id
                                        ? 'border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-300'
                                        : 'border-gray-200 bg-white/60 text-gray-600 hover:border-violet-400 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300'
                                    }`}
                                  >
                                    {store.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Address Input for Courier/Express */}
                      {(deliveryMethod === 'courier' || deliveryMethod === 'express') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6"
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Адрес доставки *
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                              placeholder="Город, улица, дом, квартира"
                              required
                            />
                          </div>
                        </motion.div>
                      )}

                      <div className="flex justify-between mt-8">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentStep(1)}
                          className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-semibold"
                        >
                          <ArrowLeft size={20} />
                          Назад
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleNextStep}
                          disabled={!deliveryMethod}
                          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-semibold transition-all ${
                            deliveryMethod
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Продолжить
                          <ArrowRight size={20} />
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {/* PLACEHOLDER - Step 3 будет следом */}

                  {/* Step 3: Payment */}
                  {currentStep === 3 && (
                    <div>
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-8"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/50"
                        >
                          <CreditCard size={32} className="text-white" />
                        </motion.div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Способ оплаты
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400">Выберите удобный метод оплаты</p>
                        </div>
                      </motion.div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {paymentOptions.map((option, index) => {
                          if (!option.available) return null;
                          const IconComponent = option.icon;
                          const isSelected = paymentMethod === option.id;
                          return (
                            <motion.div
                              key={option.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.05, y: -5 }}
                              onClick={() => setPaymentMethod(option.id)}
                              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                                isSelected
                                  ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-2 border-violet-500 shadow-lg shadow-violet-500/30'
                                  : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 hover:border-violet-300'
                              }`}
                            >
                              {option.badge && (
                                <div className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full">
                                  {option.badge}
                                </div>
                              )}

                              <div className="flex flex-col items-center text-center gap-3">
                                <motion.div
                                  animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                                  transition={{ duration: 0.5 }}
                                  className={`p-4 rounded-xl ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/50'
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  }`}
                                >
                                  <IconComponent size={32} className={isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
                                </motion.div>

                                <div>
                                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{option.title}</h3>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{option.description}</p>
                                </div>

                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="absolute bottom-2 right-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                                      <Check size={16} className="text-white" strokeWidth={3} />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Card Payment Form */}
                      {paymentMethod === 'card' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-violet-200 dark:border-violet-800"
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-violet-600 dark:text-violet-400" />
                            Данные карты
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Номер карты</label>
                              <input
                                type="text"
                                value={paymentData.cardNumber}
                                onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                                placeholder="0000 0000 0000 0000"
                                maxLength={19}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Имя владельца</label>
                              <input
                                type="text"
                                value={paymentData.cardHolder}
                                onChange={(e) => setPaymentData({...paymentData, cardHolder: e.target.value.toUpperCase()})}
                                placeholder="IVAN IVANOV"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Срок действия</label>
                                <input
                                  type="text"
                                  value={paymentData.cardExpiry}
                                  onChange={(e) => setPaymentData({...paymentData, cardExpiry: e.target.value})}
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CVV</label>
                                <input
                                  type="password"
                                  value={paymentData.cardCVV}
                                  onChange={(e) => setPaymentData({...paymentData, cardCVV: e.target.value})}
                                  placeholder="***"
                                  maxLength={3}
                                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* SBP Payment Form */}
                      {paymentMethod === 'sbp' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-violet-200 dark:border-violet-800"
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Wallet size={20} className="text-violet-600 dark:text-violet-400" />
                            Оплата через СБП
                          </h3>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон для СБП</label>
                            <input
                              type="tel"
                              value={paymentData.sbpPhone}
                              onChange={(e) => setPaymentData({...paymentData, sbpPhone: formatPhone(e.target.value)})}
                              placeholder="+7 (___) ___-__-__"
                              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              На этот номер придёт уведомление для подтверждения платежа
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Payment Progress Bar */}
                      {isSubmitting && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-violet-200 dark:border-violet-800"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Lock size={24} className="text-violet-600 dark:text-violet-400" />
                            </motion.div>
                            <span className="font-semibold text-gray-900 dark:text-white">Обработка платежа...</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${paymentProgress}%` }}
                              transition={{ duration: 0.3 }}
                              className="h-full bg-gradient-to-r from-violet-600 to-purple-600 relative"
                            >
                              <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              />
                            </motion.div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            Пожалуйста, не закрывайте страницу
                          </p>
                        </motion.div>
                      )}

                      <div className="flex justify-between mt-8">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentStep(2)}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-semibold disabled:opacity-50"
                        >
                          <ArrowLeft size={20} />
                          Назад
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: paymentMethod && !isSubmitting ? 1.05 : 1, boxShadow: paymentMethod && !isSubmitting ? "0 20px 40px rgba(139, 92, 246, 0.4)" : undefined }}
                          whileTap={{ scale: paymentMethod && !isSubmitting ? 0.95 : 1 }}
                          onClick={handleSubmit}
                          disabled={isSubmitting || !paymentMethod}
                          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-semibold transition-all ${
                            paymentMethod && !isSubmitting
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              Оформление...
                            </>
                          ) : (
                            <>
                              <Lock size={20} />
                              Оформить заказ
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar - Новый дизайн */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 shadow-2xl sticky top-24"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />

              <div className="relative p-6">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/50"
                  >
                    <ShoppingBag size={24} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Ваш заказ
                  </h3>
                </motion.div>

                {/* Items list */}
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto scrollbar-hide">
                  {cart.items.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex gap-3 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
                    >
                      <div className="relative flex-shrink-0">
                        <motion.img
                          whileHover={{ scale: 1.1 }}
                          src={item.image?.trim() || '/placeholder-image.jpg'}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg shadow-violet-500/50"
                        >
                          {item.quantity}
                        </motion.span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                          {item.name}
                        </h4>

                        {(item.size || item.color) && (
                          <div className="flex gap-2 mb-2">
                            {item.size && (
                              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-1 rounded-lg">
                                {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">
                                {item.color}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="font-bold text-violet-600 dark:text-violet-400">
                            {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Товары:</span>
                    <span className="font-semibold">{cart.total.toLocaleString('ru-RU')} ₽</span>
                  </div>

                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Доставка:</span>
                    <span className="font-semibold">
                      {getDeliveryPrice() > 0
                        ? `${getDeliveryPrice().toLocaleString('ru-RU')} ₽`
                        : <span className="text-green-600 dark:text-green-400 font-bold">Бесплатно ✓</span>}
                    </span>
                  </div>

                  {getDiscount() > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-between text-green-600 dark:text-green-400 font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <Percent size={18} />
                        <span>Скидка:</span>
                      </div>
                      <span className="font-bold">-{getDiscount().toLocaleString('ru-RU')} ₽</span>
                    </motion.div>
                  )}

                  {/* Promo Code Section */}
                  <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    {!appliedCoupon ? (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Gift size={16} className="text-violet-600" />
                          Промокод
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
                            onBlur={() => promoCode.trim() && validatePromoCode()}
                            placeholder="Введите код"
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-sm uppercase font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:normal-case placeholder:font-normal"
                          />
                          {validatingCoupon && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                            >
                              <Check size={18} className="text-white" strokeWidth={3} />
                            </motion.div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{appliedCoupon.code}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {appliedCoupon.type === 'percent'
                                  ? `Скидка ${appliedCoupon.discount}%`
                                  : `Скидка ${appliedCoupon.discount} ₽`}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={removeCoupon}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Удалить промокод"
                          >
                            <span className="text-xl">×</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Final Total */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center text-2xl font-bold pt-4 border-t-2 border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-gray-900 dark:text-white">Итого:</span>
                    <motion.span
                      key={finalTotal}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
                    >
                      {finalTotal.toLocaleString('ru-RU')} ₽
                    </motion.span>
                  </motion.div>
                </div>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <BadgeCheck size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span>Безопасная оплата</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Shield size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Защита покупателя</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                      <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <span>Кэшбэк 5%</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <StorePickerModal
        open={isStorePickerOpen}
        stores={stores}
        selectedStore={selectedStore}
        onClose={() => setIsStorePickerOpen(false)}
        onConfirm={handleStoreConfirm}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333ea, #ec4899);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7e22ce, #db2777);
        }
      `}</style>
    </div>
  );
}
