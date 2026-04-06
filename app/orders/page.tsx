// app/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Определяем тип для заказа
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface Recipient {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  deliveryPrice: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  recipient: Recipient;
  comment?: string;
}

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user && user.orders) {
      // Используем функцию обновления состояния вместо прямого вызова setOrders
      setOrders(prevOrders => {
        // Проверяем, изменились ли заказы
        if (JSON.stringify(prevOrders) !== JSON.stringify(user.orders)) {
          return user.orders;
        }
        return prevOrders;
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Требуется авторизация</h1>
          <p className="text-gray-700 mb-8">Для просмотра заказов необходимо войти в аккаунт</p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
          >
            Войти в аккаунт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Мои заказы</h1>
          <p className="text-gray-900">Просматривайте историю ваших заказов и отслеживайте их статус</p>
        </motion.div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Package size={80} className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">У вас пока нет заказов</h2>
            <p className="text-gray-900 mb-8">Начните покупки, чтобы увидеть их здесь</p>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl transition-all"
            >
              Начать покупки
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Заказ #{order.id.substring(0, 8)}</h3>
                    <p className="text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'processing' ? 'Обрабатывается' :
                       order.status === 'shipped' ? 'Отправлен' :
                       order.status === 'delivered' ? 'Доставлен' : 'Отменен'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Truck size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Способ доставки</p>
                      <p className="font-medium">
                        {order.deliveryMethod === 'pickup' ? 'Самовывоз' :
                         order.deliveryMethod === 'courier' ? 'Курьер' : 'Экспресс'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Способ оплаты</p>
                      <p className="font-medium">
                        {order.paymentMethod === 'card' ? 'Банковская карта' :
                         order.paymentMethod === 'online' ? 'Онлайн-банкинг' :
                         order.paymentMethod === 'cash' ? 'Наличными' : 'Рассрочка'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ShoppingBag size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">Количество товаров</p>
                      <p className="font-medium">{order.items.length}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Итого:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {order.total.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}