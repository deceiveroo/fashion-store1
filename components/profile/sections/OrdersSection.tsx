'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Order } from '@/app/profile/hooks/useProfileData';

interface OrdersSectionProps {
  orders: Order[];
}

export default function OrdersSection({ orders }: OrdersSectionProps) {
  if (orders.length === 0) {
    return (
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
    );
  }

  return (
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
  );
}
