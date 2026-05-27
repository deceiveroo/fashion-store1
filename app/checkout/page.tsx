// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Store, CreditCard, Shield, Zap, Gift, Sparkles, ShoppingBag, MapPin, Clock, Wallet, User, Package, ChevronDown, Coins, Check, ArrowRight, ArrowLeft, Star, Lock, Percent, TrendingUp, Heart, BadgeCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

interface StoreItem {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  rating: number;
}

export default function CheckoutPage() {
  const { state: cart, clearCart } = useCart();
  const { user, addOrder, updateOrderStatus } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'individual' | 'legal'>('individual');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier' | 'express'>('pickup');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stores, setStores] = useState<StoreItem[]>([]);
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
      .then(data => setStores(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading stores:', err));
  }, []);

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
          address: deliveryMethod === 'pickup' ? selectedStoreId : formData.address
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 pb-12">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), opacity: 1 }}
                animate={{ 
                  y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 20,
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-4"
          >
            <ShoppingBag size={48} className="text-purple-600 dark:text-purple-400" />
          </motion.div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Оформление заказа
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Осталось совсем немного до получения ваших покупок
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-100 dark:border-purple-900/50"
            >
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute top-6 left-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                />

                <div className="relative flex justify-between gap-4 sm:gap-8">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center z-10 flex-1 min-w-0"
                    >
                      <motion.div
                        animate={{
                          scale: step.id === currentStep ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.5 }}
                        className={`w-16 h-16 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                          step.completed || step.id === currentStep
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {step.completed ? (
                          <Check size={28} className="sm:size-6 animate-bounce" />
                        ) : (
                          <step.icon size={28} className="sm:size-6" />
                        )}
                      </motion.div>
                      
                      <span className={`text-sm font-semibold transition-colors text-center ${
                        step.completed || step.id === currentStep 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.name}
                      </span>
                      
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center hidden sm:block">
                        {step.description}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-100 dark:border-purple-900/50"
              >
                {/* Step 1: Contact Info */}
                {currentStep === 1 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Контактные данные</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Заполните информацию для связи</p>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Имя *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Введите имя"
                            required
                          />
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Фамилия *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Введите фамилию"
                            required
                          />
                        </motion.div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Телефон *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="+7 (___) ___-__-__"
                            required
                          />
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="your@email.com"
                            required
                          />
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
                          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                          placeholder="Укажите дополнительные пожелания"
                        />
                      </motion.div>
                    </div>
                    
                    <div className="flex justify-end mt-8">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
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
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                        <Package size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Способ доставки</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Выберите удобный вариант получения</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {deliveryOptions.map((option, index) => {
                        const IconComponent = option.icon;
                        return (
                          <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleDeliverySelect(option.id as 'pickup' | 'courier' | 'express')}
                            className={`relative p-4 sm:p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                              deliveryMethod === option.id
                                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg shadow-purple-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-900'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                              <motion.div
                                animate={deliveryMethod === option.id ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                                transition={{ duration: 0.5 }}
                                className={`p-3 sm:p-4 rounded-xl shadow-lg bg-gradient-to-br ${option.color} flex-shrink-0 w-full sm:w-auto flex justify-center`}
                              >
                                <IconComponent size={28} className="text-white sm:text-[32px]" strokeWidth={2.5} />
                              </motion.div>
                              
                              <div className="flex-1 min-w-0 w-full">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                  <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{option.title}</h3>
                                  <span className="font-bold text-base sm:text-lg text-purple-600 dark:text-purple-400 whitespace-nowrap">{option.price}</span>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{option.description}</p>
                                
                                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                    <Clock size={14} className="sm:w-4 sm:h-4" />
                                    <span>{option.time}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                                    <MapPin size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="truncate">{option.details}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {deliveryMethod === option.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                                  transition={{ duration: 0.4, delay: 0.1 }}
                                  className="flex-shrink-0 self-end sm:self-start"
                                >
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                                    <Check size={14} className="sm:w-4 sm:h-4 text-white" strokeWidth={3.5} />
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
                        className="mt-6"
                      >
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Выберите магазин для самовывоза *
                        </label>
                        <select
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">-- Выберите магазин --</option>
                          {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name} — {store.address}
                            </option>
                          ))}
                        </select>
                        
                        {selectedStoreId && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                          >
                            {(() => {
                              const store = stores.find(s => s.id === selectedStoreId);
                              if (!store) return null;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Store size={18} className="text-purple-600 dark:text-purple-400" />
                                    <p className="font-semibold text-gray-900 dark:text-white">{store.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin size={18} className="text-purple-600 dark:text-purple-400" />
                                    <p className="text-gray-700 dark:text-gray-300">{store.address}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-purple-600 dark:text-purple-400" />
                                    <p className="text-gray-600 dark:text-gray-400">{store.hours}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                    <p className="text-gray-600 dark:text-gray-400">Рейтинг: {store.rating}/5</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Address Input for Courier/Express */}
                    {(deliveryMethod === 'courier' || deliveryMethod === 'express') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6"
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
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <ArrowLeft size={20} />
                        Назад
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNextStep}
                        disabled={!deliveryMethod}
                        className={`flex items-center gap-2 px-10 py-4 rounded-xl font-semibold transition-all ${
                          deliveryMethod
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/50'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Продолжить
                        <ArrowRight size={20} />
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
                        <CreditCard size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Способ оплаты</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Выберите удобный метод оплаты</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentOptions.map((option, index) => {
                        if (!option.available) return null;
                        
                        const IconComponent = option.icon;
                        return (
                          <motion.div
                            key={option.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setPaymentMethod(option.id)}
                            className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                              paymentMethod === option.id
                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg shadow-purple-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-900'
                            }`}
                          >
                            {option.badge && (
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${option.color} text-white`}>
                                {option.badge}
                              </div>
                            )}
                            
                            <div className="flex flex-col items-center text-center gap-3">
                              <motion.div
                                animate={paymentMethod === option.id ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                className={`p-4 rounded-xl shadow-md bg-gradient-to-br ${option.color}`}
                              >
                                <IconComponent size={32} className="text-white" />
                              </motion.div>
                              
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{option.title}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{option.description}</p>
                              </div>
                              
                              {paymentMethod === option.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute bottom-2 right-2"
                                >
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                    <Check size={14} className="text-white" />
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
                        className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <CreditCard size={20} className="text-blue-600" />
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
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Имя владельца</label>
                            <input
                              type="text"
                              value={paymentData.cardHolder}
                              onChange={(e) => setPaymentData({...paymentData, cardHolder: e.target.value.toUpperCase()})}
                              placeholder="IVAN IVANOV"
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className="mt-6 p-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border border-green-200 dark:border-green-800"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Wallet size={20} className="text-green-600" />
                          Оплата через СБП
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон для СБП</label>
                          <input
                            type="tel"
                            value={paymentData.sbpPhone}
                            onChange={(e) => setPaymentData({...paymentData, sbpPhone: formatPhone(e.target.value)})}
                            placeholder="+7 (___) ___-__-__"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Lock size={20} className="text-purple-600 dark:text-purple-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">Обработка платежа...</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${paymentProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                          />
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
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
                      >
                        <ArrowLeft size={20} />
                        Назад
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: paymentMethod && !isSubmitting ? 1.05 : 1 }}
                        whileTap={{ scale: paymentMethod && !isSubmitting ? 0.95 : 1 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting || !paymentMethod}
                        className={`flex items-center gap-2 px-10 py-4 rounded-xl font-semibold transition-all ${
                          paymentMethod && !isSubmitting
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/50'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-purple-100 dark:border-purple-900/50 sticky top-24"
            >
              <div className="flex items-center gap-2 mb-6">
                <ShoppingBag size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ваш заказ</h3>
              </div>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto custom-scrollbar">
                {cart.items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">{item.name}</h4>
                      
                      {/* Size and Color */}
                      {(item.size || item.color) && (
                        <div className="flex gap-2 mb-2">
                          {item.size && (
                            <span className="text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                              {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs text-pink-600 bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 rounded-full">
                              {item.color}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Товары:</span>
                  <span className="font-semibold">{cart.total.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Доставка:</span>
                  <span className="font-semibold">
                    {getDeliveryPrice() > 0 
                      ? `${getDeliveryPrice().toLocaleString('ru-RU')} ₽` 
                      : <span className="text-green-600 dark:text-green-400">Бесплатно</span>}
                  </span>
                </div>
                
                {getDiscount() > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between text-green-600 dark:text-green-400"
                  >
                    <div className="flex items-center gap-1">
                      <Percent size={16} />
                      <span>Скидка:</span>
                    </div>
                    <span className="font-semibold">-{getDiscount().toLocaleString('ru-RU')} ₽</span>
                  </motion.div>
                )}

                {/* Promo Code Section */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Gift size={16} className="text-purple-600" />
                        Промокод
                      </label>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && validatePromoCode()}
                        onBlur={() => promoCode.trim() && validatePromoCode()}
                        placeholder="Введите код и нажмите Enter"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm uppercase transition-all placeholder:text-gray-400"
                      />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check size={18} className="text-green-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{appliedCoupon.code}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {appliedCoupon.type === 'percent' 
                                ? `Скидка ${appliedCoupon.discount}%` 
                                : `Скидка ${appliedCoupon.discount} ₽`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Удалить промокод"
                        >
                          <ArrowLeft size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>Итого:</span>
                  <motion.span
                    key={finalTotal}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                  >
                    {finalTotal.toLocaleString('ru-RU')} ₽
                  </motion.span>
                </div>
              </div>
              
              {getDiscount() > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <Gift size={20} />
                    <span className="font-semibold">Скидка {getDiscount().toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Вы экономите на этом заказе!
                  </p>
                </motion.div>
              )}

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <BadgeCheck size={16} className="text-green-500" />
                  <span>Безопасная оплата</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield size={16} className="text-blue-500" />
                  <span>Защита покупателя</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp size={16} className="text-purple-500" />
                  <span>Кэшбэк 5%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

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
