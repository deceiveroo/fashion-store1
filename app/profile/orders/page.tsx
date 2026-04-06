// app/profile/orders/page.tsx
'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Package, Calendar, CreditCard, MapPin, Clock, CheckCircle, Truck, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const { user } = useAuth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <RefreshCw size={16} className="text-blue-600" />;
      case 'shipped':
        return <Truck size={16} className="text-orange-600" />;
      case 'delivered':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Package size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'В обработке';
      case 'shipped':
        return 'В пути';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Package size={80} className="mx-auto text-gray-400 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Необходима авторизация</h1>
          <p className="text-gray-600 mb-8">Пожалуйста, войдите в систему чтобы просмотреть свои заказы.</p>
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  if ((user.orders?.length || 0) === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <Package size={80} className="mx-auto text-gray-400 mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Заказов пока нет</h1>
          <p className="text-gray-600 mb-8">Совершите первую покупку и она появится здесь.</p>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
          >
            Начать покупки
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Мои заказы
          </h1>
          <p className="text-gray-600 text-center">
            {user.orders?.length || 0} заказ{(user.orders?.length || 0) > 1 ? 'а' : ''} в истории
          </p>
        </motion.div>

        <div className="space-y-6">
          {(user.orders || []).map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/50 hover:shadow-3xl transition-all"
            >
              {/* Заголовок заказа */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">Заказ #{order.id}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)} flex items-center gap-2`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard size={16} />
                      <span>{order.paymentMethod || 'Не указан'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{order.deliveryMethod || 'Не указан'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {Math.round(order.total || 0)} ₽
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {(order.items?.length || 0)} товар{(order.items?.length || 0) > 1 ? 'а' : ''}
                  </div>
                </div>
              </div>

              {/* Товары в заказе */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Состав заказа:</h3>
                <div className="grid gap-3">
                  {(order.items || []).map((item, itemIndex) => (
                    <motion.div
                      key={`${item.id}-${itemIndex}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.1) + (itemIndex * 0.05) }}
                      className="flex items-center gap-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50"
                    >
                      <img
                        src={item.image || '/placeholder-image.jpg'}
                        alt={item.name}
                        className="w-[60px] h-[60px] rounded-lg object-cover border border-white shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {item.size && <span className="bg-gray-200 px-2 py-1 rounded mr-2">{item.size}</span>}
                          {item.color && <span className="bg-gray-200 px-2 py-1 rounded">{item.color}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{Math.round(item.price)} ₽</div>
                        <div className="text-xs text-gray-600 mt-1">×{item.quantity}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Детали доставки и получателя */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Получатель</h4>
                    {order.recipient ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{order.recipient.firstName} {order.recipient.lastName}</div>
                        <div>{order.recipient.phone}</div>
                        <div>{order.recipient.email}</div>
                        {order.recipient.address && (
                          <div className="mt-2">
                            <div className="font-medium">Адрес доставки:</div>
                            <div>{order.recipient.address}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Информация о получателе недоступна</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Детали оплаты</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Стоимость товаров:</span>
                        <span>{Math.round((order.total || 0) - (order.deliveryPrice || 0) + (order.discount || 0))} ₽</span>
                      </div>
                      {(order.discount || 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Скидка:</span>
                          <span>-{order.discount} ₽</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Доставка:</span>
                        <span>{(order.deliveryPrice || 0) === 0 ? 'Бесплатно' : `${order.deliveryPrice} ₽`}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-1 flex justify-between font-semibold text-gray-900">
                        <span>Итого:</span>
                        <span>{Math.round(order.total || 0)} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>

                {order.comment && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-1">Комментарий к заказу</h4>
                    <p className="text-sm text-gray-600">{order.comment}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}