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

  // Calculate finalTotal early in the component
  const getDiscount = () => {
    if (cart.total > 5000) return 500;
    if (cart.total > 3000) return 300;
    if (cart.total > 1000) return 100;
    return 0;
  };

  const getDeliveryPrice = () => {
    if (deliveryMethod === 'express') return 490;
    if (deliveryMethod === 'courier' && cart.total < 2000) return 200;
    return 0;
  };

  const finalTotal = Math.max(0, cart.total - getDiscount() + getDeliveryPrice());
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  
  // Обновляем данные формы при изменении пользователя
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user]);

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
      id: 'online',
      title: 'Онлайн-банкинг',
      icon: Wallet,
      description: 'Qiwi, ЮMoney',
      available: !!deliveryMethod,
      color: 'from-orange-500 to-red-500'
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
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
        comment: formData.comment
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
              href="/products" 
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

                <div className="relative flex justify-between">
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center z-10"
                    >
                      <motion.div
                        animate={{
                          scale: step.id === currentStep ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.5 }}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                          step.completed || step.id === currentStep
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.completed ? (
                          <Check size={24} className="animate-bounce" />
                        ) : (
                          <step.icon size={24} />
                        )}
                      </motion.div>
                      
                      <span className={`text-sm font-semibold transition-colors ${
                        step.completed || step.id === currentStep 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.name}
                      </span>
                      
                      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleDeliverySelect(option.id as 'pickup' | 'courier' | 'express')}
                            className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                              deliveryMethod === option.id
                                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg shadow-purple-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-900'
                            }`}
                          >
                            {option.badge && (
                              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${option.color} text-white`}>
                                {option.badge}
                              </div>
                            )}
                            
                            <div className="flex items-start gap-4">
                              <motion.div
                                animate={deliveryMethod === option.id ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                className={`p-3 rounded-xl shadow-md bg-gradient-to-br ${option.color}`}
                              >
                                <IconComponent size={28} className="text-white" />
                              </motion.div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{option.title}</h3>
                                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{option.price}</span>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{option.description}</p>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
                                    <Clock size={16} />
                                    <span>{option.time}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
                                    <MapPin size={16} />
                                    <span>{option.details}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {deliveryMethod === option.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex-shrink-0"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                    <Check size={18} className="text-white" />
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
                    key={item.id}
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
