'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Package, Truck, CheckCircle, Clock, MapPin, 
  CreditCard, Phone, Mail, User, ChevronDown, ChevronUp,
  Download, Star, MessageCircle, RefreshCw, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  deliveryPrice: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else if (res.status === 401) {
        toast.error('Требуется авторизация');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any; bg: string }> = {
      pending: { label: 'Ожидает оплаты', color: 'text-yellow-700', icon: Clock, bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
      processing: { label: 'Обрабатывается', color: 'text-blue-700', icon: Package, bg: 'bg-blue-100 dark:bg-blue-900/30' },
      shipped: { label: 'Отправлен', color: 'text-purple-700', icon: Truck, bg: 'bg-purple-100 dark:bg-purple-900/30' },
      delivered: { label: 'Доставлен', color: 'text-green-700', icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/30' },
      cancelled: { label: 'Отменен', color: 'text-red-700', icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Мои заказы
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Отслеживайте статус ваших заказов</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap gap-3 justify-center"
        >
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              {status === 'all' ? 'Все' : getStatusInfo(status).label}
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl text-center"
          >
            <Package size={80} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {filterStatus === 'all' ? 'У вас пока нет заказов' : 'Нет заказов с таким статусом'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Начните покупки, чтобы увидеть их здесь
            </p>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all"
            >
              <ShoppingBag size={20} />
              Начать покупки
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {/* Order Header */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded-2xl shadow-md">
                          <Package className="text-purple-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Заказ #{order.id.substring(0, 8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg}`}>
                          <StatusIcon size={18} className={statusInfo.color} />
                          <span className={`font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 space-y-6">
                          {/* Items */}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              <ShoppingBag size={18} />
                              Товары ({order.items.length})
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center overflow-hidden">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="text-gray-400" size={24} />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 dark:text-white">{item.name}</h5>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      {item.size && <span>Размер: {item.size}</span>}
                                      {item.color && <span>Цвет: {item.color}</span>}
                                      <span>Кол-во: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {item.price.toLocaleString('ru-RU')} ₽ × {item.quantity}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery & Payment Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
                              <div className="flex items-center gap-3 mb-3">
                                <Truck className="text-blue-600" size={20} />
                                <h5 className="font-semibold text-gray-900 dark:text-white">Доставка</h5>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                {order.deliveryMethod === 'pickup' ? 'Самовывоз' :
                                 order.deliveryMethod === 'courier' ? 'Курьер' : 'Экспресс'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {order.deliveryPrice === 0 ? 'Бесплатно' : `${order.deliveryPrice} ₽`}
                              </p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl">
                              <div className="flex items-center gap-3 mb-3">
                                <CreditCard className="text-green-600" size={20} />
                                <h5 className="font-semibold text-gray-900 dark:text-white">Оплата</h5>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                {order.paymentMethod === 'card' ? 'Банковская карта' :
                                 order.paymentMethod === 'sbp' ? 'СБП' :
                                 order.paymentMethod === 'cash' ? 'Наличными' : 'Другое'}
                              </p>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Товары:</span>
                                <span>{(order.total - order.deliveryPrice + order.discount).toLocaleString('ru-RU')} ₽</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Скидка:</span>
                                  <span>-{order.discount.toLocaleString('ru-RU')} ₽</span>
                                </div>
                              )}
                              {order.deliveryPrice > 0 && (
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                  <span>Доставка:</span>
                                  <span>{order.deliveryPrice.toLocaleString('ru-RU')} ₽</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span>Итого:</span>
                                <span>{order.total.toLocaleString('ru-RU')} ₽</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                              <Download size={18} />
                              Скачать чек
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:shadow-md transition-all">
                              <MessageCircle size={18} />
                              Поддержка
                            </button>
                            {order.status === 'delivered' && (
                              <button className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                                <Star size={18} />
                                Оставить отзыв
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quick Summary (when collapsed) */}
                  {!isExpanded && (
                    <div className="p-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span>{order.items.length} товаров</span>
                        <span>•</span>
                        <span>{order.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {order.total.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
