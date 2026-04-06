// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Store, CreditCard, Shield, Zap, Gift, Sparkles, ShoppingBag, MapPin, Clock, Wallet, User, Package, ChevronDown, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { toast } from 'sonner';

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

  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (stripeKey) {
        setStripePromise(loadStripe(stripeKey));
      }
    };
    initializeStripe();
  }, []);

  // Create payment intent when user chooses card payment
  useEffect(() => {
    if (paymentMethod === 'card' && finalTotal > 0) {
      createPaymentIntent();
    }
  }, [paymentMethod, finalTotal]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100), // Convert to cents
          currency: 'rub',
        }),
      });

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Ошибка при подготовке оплаты');
    }
  };

  const steps = [
    { id: 1, name: 'Данные', completed: currentStep > 1, icon: User },
    { id: 2, name: 'Доставка', completed: currentStep > 2, icon: Package },
    { id: 3, name: 'Оплата', completed: false, icon: CreditCard }
  ];

  const deliveryOptions = [
    {
      id: 'pickup',
      title: 'Самовывоз',
      icon: Store,
      description: 'Пункты выдачи и отделения Почты России',
      price: 'Бесплатно',
      time: '1-3 дня',
      details: 'Более 200 пунктов выдачи в вашем городе'
    },
    {
      id: 'courier',
      title: 'Курьером',
      icon: Truck,
      description: 'По адресу до двери',
      price: 'Бесплатно от 2000 ₽',
      time: '1-2 дня',
      details: 'Бесплатная доставка при заказе от 2000 ₽'
    },
    {
      id: 'express',
      title: 'Экспресс',
      icon: Zap,
      description: 'Доставка за 2 часа',
      price: '490 ₽',
      time: '2 часа',
      details: 'В пределах города в течение 2 часа'
    }
  ];

  const paymentOptions = [
    {
      id: 'card',
      title: 'Банковская карта',
      icon: CreditCard,
      description: 'Visa, Mastercard, МИР',
      available: true
    },
    {
      id: 'sbp',
      title: 'СБП (Система Быстрых Платежей)',
      icon: Wallet,
      description: 'Оплата через QR-код или номер телефона',
      available: true
    },
    {
      id: 'online',
      title: 'Онлайн-банкинг',
      icon: Wallet,
      description: 'Qiwi, ЮMoney',
      available: !!deliveryMethod
    },
    {
      id: 'crypto',
      title: 'Криптовалюта',
      icon: Coins,
      description: 'LTC, USDT TRC-20, TON, NOT',
      available: true
    },
    {
      id: 'cash',
      title: 'Наличными',
      icon: Wallet,
      description: 'При получении',
      available: deliveryMethod === 'courier' || deliveryMethod === 'express'
    },
    {
      id: 'installment',
      title: 'Рассрочка',
      icon: Shield,
      description: '0% на 4 месяца',
      available: cart.total > 3000
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
    // Сбрасываем выбранный магазин при смене способа доставки
    if (method !== 'pickup') {
      setSelectedStoreId('');
    }
    setPaymentMethod('');
  };

  const handleNextStep = () => {
    // Валидация на шаге доставки
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

    // Проверяем, что все обязательные поля заполнены
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email) {
      toast.error('Пожалуйста, заполните все обязательные контактные данные');
      return;
    }

    // Проверяем, что выбран способ доставки
    if (!deliveryMethod) {
      toast.error('Пожалуйста, выберите способ доставки');
      return;
    }

    // Для самовывоза проверяем, что выбран магазин
    if (deliveryMethod === 'pickup' && !selectedStoreId) {
      toast.error('Пожалуйста, выберите магазин для самовывоза');
      return;
    }

    // Для курьерской доставки проверяем, что введен адрес
    if ((deliveryMethod === 'courier' || deliveryMethod === 'express') && !formData.address) {
      toast.error('Пожалуйста, введите адрес доставки');
      return;
    }

    setIsSubmitting(true);

    try {
      // Подготовка данных для отправки
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

      console.log('Отправляем заказ:', JSON.stringify(order, null, 2));

      // Создаем заказ через API
      const createdOrder = await addOrder(order);

      // Обработка оплаты в зависимости от выбранного метода
      if (paymentMethod === 'card' && clientSecret) {
        // Обработка оплаты картой через Stripe
        const stripe = await stripePromise;
        if (!stripe) {
          toast.error('Ошибка инициализации оплаты');
          return;
        }

        const { error } = await stripe.confirmPayment({
          elements: null as any, // We'll create elements later if needed
          confirmParams: {
            return_url: `${window.location.origin}/orders`,
          },
          clientSecret,
        });

        if (error) {
          console.error('Stripe error:', error);
          toast.error(`Ошибка оплаты: ${error.message || 'Неизвестная ошибка'}`);
          
          // Обновляем статус заказа на "неоплачен"
          await updateOrderStatus(createdOrder.id, 'cancelled');
        } else {
          // Успешная оплата - обновляем статус заказа
          await updateOrderStatus(createdOrder.id, 'paid');
          toast.success('Оплата прошла успешно!');
        }
      } else if (paymentMethod === 'sbp') {
        // Обработка СБП - создание QR-кода или ссылки для оплаты
        const sbpResponse = await fetch('/api/create-sbp-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: createdOrder.id,
            amount: finalTotal,
            phone: formData.phone,
          }),
        });

        const sbpData = await sbpResponse.json();

        if (sbpResponse.ok && sbpData.paymentUrl) {
          // Открываем страницу оплаты СБП
          window.open(sbpData.paymentUrl, '_blank');
          toast.success('Открываю страницу оплаты СБП...');
        } else {
          toast.error(sbpData.error || 'Ошибка при создании оплаты СБП');
          await updateOrderStatus(createdOrder.id, 'cancelled');
        }
      } else if (paymentMethod === 'crypto') {
        // Открываем модальное окно для выбора криптовалюты
        setIsCryptoModalOpen(true);
      } else {
        // Для других методов оплаты (наличные, рассрочка и т.д.)
        // Пока просто показываем уведомление
        toast.success('Заказ успешно оформлен!');
      }

      // Очищаем корзину
      clearCart();
      // Также очищаем localStorage для текущего пользователя и гостя
      if (user) {
        localStorage.removeItem(`cart_${user.id}`);
      }
      localStorage.removeItem('cart');

      // Перенаправляем на страницу заказов
      router.push('/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
      // Проверяем, является ли ошибка объектом ошибки с сообщением
      if (error instanceof Error) {
        toast.error(`Ошибка при оформлении заказа: ${error.message}`);
      } else {
        toast.error('Ошибка при оформлении заказа. Попробуйте еще раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle crypto payment
  const handleCryptoPayment = async () => {
    if (!selectedCrypto) {
      toast.error('Пожалуйста, выберите криптовалюту');
      return;
    }

    setLoadingCryptoAddress(true);
    try {
      // Request crypto address from API
      const response = await fetch('/api/create-crypto-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: createdOrder?.id,
          cryptoCurrency: selectedCrypto,
          amount: finalTotal,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setCryptoAddress(data.address);
        toast.success(`Адрес для оплаты ${selectedCrypto} сгенерирован`);
      } else {
        toast.error(data.error || 'Ошибка при генерации адреса оплаты');
      }
    } catch (error) {
      console.error('Error generating crypto address:', error);
      toast.error('Ошибка при генерации адреса оплаты');
    } finally {
      setLoadingCryptoAddress(false);
    }
  };

  // Если корзина пуста, показываем сообщение
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <ShoppingBag size={80} className="mx-auto text-gray-300 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Корзина пуста</h1>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
          >
            Начать покупки
            <Zap size={20} />
          </Link>
        </div>
      </div>
    );
  }

  // Render crypto modal
  const renderCryptoModal = () => {
    if (!isCryptoModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Оплата криптовалютой</h3>
            <button 
              onClick={() => setIsCryptoModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {!cryptoAddress ? (
            <>
              <p className="text-gray-600 mb-4">Выберите криптовалюту для оплаты:</p>
              
              <div className="space-y-3">
                {['LTC', 'USDT TRC-20', 'TON', 'NOT'].map((crypto) => (
                  <div
                    key={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedCrypto === crypto
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{crypto}</span>
                      {selectedCrypto === crypto && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCryptoPayment}
                disabled={!selectedCrypto || loadingCryptoAddress}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedCrypto && !loadingCryptoAddress
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loadingCryptoAddress ? 'Генерация адреса...' : 'Сгенерировать адрес оплаты'}
              </button>
            </>
          ) : (
            <div className="text-center">
              <h4 className="font-semibold text-lg mb-2">Оплата {selectedCrypto}</h4>
              <p className="text-gray-600 mb-4">
                Отправьте {finalTotal.toFixed(2)} RUB эквивалента на адрес ниже:
              </p>
              
              <div className="p-4 bg-gray-100 rounded-lg mb-4 break-all">
                <p className="font-mono text-sm">{cryptoAddress}</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-700 text-sm">
                  После отправки платежа, пожалуйста, сохраните TXID и сообщите о нем в поддержку
                </p>
              </div>
              
              <button
                onClick={() => {
                  setIsCryptoModalOpen(false);
                  setCryptoAddress(null);
                  setSelectedCrypto(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Оформление заказа</h1>
          <p className="text-gray-800">Проверьте заказ и заполните данные для доставки</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex justify-between relative">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      step.completed || step.id === currentStep
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <step.icon size={20} />
                    </div>
                    <span className={`text-sm font-medium ${
                      step.completed || step.id === currentStep ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                ))}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
              </div>
            </div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Контактные данные</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Имя *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Введите имя"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Фамилия *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Введите фамилию"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Телефон *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="+7 (___) ___-__-__"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Комментарий к заказу
                      </label>
                      <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Укажите дополнительные пожелания"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-8">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Продолжить
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Способ доставки</h2>
                  
                  <div className="space-y-4">
                    {deliveryOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <div
                          key={option.id}
                          onClick={() => handleDeliverySelect(option.id as 'pickup' | 'courier' | 'express')}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            deliveryMethod === option.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <IconComponent size={24} className="text-purple-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-gray-900">{option.title}</h3>
                                <span className="font-bold text-gray-900">{option.price}</span>
                              </div>
                              
                              <p className="text-gray-700 text-sm">{option.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                <Clock size={16} />
                                <span>{option.time}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{option.details}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Выбор магазина при самовывозе */}
                  {deliveryMethod === 'pickup' && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Выберите магазин для самовывоза *
                      </label>
                      <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">-- Выберите магазин --</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name} — {store.address}
                          </option>
                        ))}
                      </select>
                      {selectedStoreId && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          {(() => {
                            const store = stores.find(s => s.id === selectedStoreId);
                            if (!store) return null;
                            return (
                              <div className="text-sm text-gray-700">
                                <p className="font-semibold">{store.name}</p>
                                <p>{store.address}</p>
                                <p className="text-gray-500 mt-1">{store.hours}</p>
                                <p className="text-gray-500">{store.phone}</p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Адрес при доставке курьером/экспресс */}
                  {(deliveryMethod === 'courier' || deliveryMethod === 'express') && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Адрес доставки *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Город, улица, дом, квартира"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 text-gray-800 hover:text-purple-600 transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!deliveryMethod}
                      className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                        deliveryMethod
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Продолжить
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Способ оплаты</h2>
                  
                  <div className="space-y-4">
                    {paymentOptions.map((option) => {
                      if (!option.available) return null;
                      
                      const IconComponent = option.icon;
                      return (
                        <div
                          key={option.id}
                          onClick={() => setPaymentMethod(option.id)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === option.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <IconComponent size={24} className="text-purple-600" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{option.title}</h3>
                              <p className="text-gray-800 text-sm">{option.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 text-gray-800 hover:text-purple-600 transition-colors"
                    >
                      Назад
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !paymentMethod}
                      className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        paymentMethod && !isSubmitting
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Оформление...
                        </>
                      ) : (
                        'Оформить заказ'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Ваш заказ</h3>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.name}
                        className="w-[60px] h-[60px] rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-700">
                          {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-800">
                  <span>Товары:</span>
                  <span>{cart.total.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="flex justify-between text-gray-800">
                  <span>Доставка:</span>
                  <span>
                    {getDeliveryPrice() > 0 
                      ? `${getDeliveryPrice().toLocaleString('ru-RU')} ₽` 
                      : 'Бесплатно'}
                  </span>
                </div>
                
                {getDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Скидка:</span>
                    <span>-{getDiscount().toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                  <span>Итого:</span>
                  <span>{finalTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center gap-2 text-purple-600">
                  <Gift size={20} />
                  <span className="font-medium">Скидка {getDiscount().toLocaleString('ru-RU')} ₽</span>
                </div>
                <p className="text-sm text-gray-800 mt-1">
                  при заказе от {Math.max(1000, cart.total).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}