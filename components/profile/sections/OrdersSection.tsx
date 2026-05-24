'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ExternalLink, Calendar, CreditCard, Truck } from 'lucide-react';
import { Order } from '@/app/profile/hooks/useProfileData';
import ProxyImage from '@/components/ProxyImage';

interface OrdersSectionProps {
  orders: Order[];
}

export default function OrdersSection({ orders }: OrdersSectionProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          У вас пока нет заказов
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Оформите первый заказ, чтобы отслеживать его статус здесь
        </p>
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
        >
          Начать покупки
        </Link>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Доставлен', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Truck };
      case 'shipped':
        return { label: 'В пути', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Truck };
      case 'processing':
        return { label: 'Обрабатывается', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Package };
      case 'cancelled':
        return { label: 'Отменен', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Package };
      default:
        return { label: 'Ожидает', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: Package };
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order, index) => {
        const statusInfo = getStatusInfo(order.status);
        const StatusIcon = statusInfo.icon;
        
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          >
            {/* Order Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Заказ #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${statusInfo.color}`}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={14} />
                      {order.paymentMethod || 'Не указано'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {order.total.toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {order.items?.length || 0} товар(ов)
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Preview */}
            {order.items && order.items.length > 0 && (
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Товары в заказе:
                </h4>
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      {item.image && (
                        <ProxyImage
                          src={item.image}
                          alt={item.productName || item.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          proxyWidth={128}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.productName || item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.quantity} шт. × {item.price?.toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                      +{order.items.length - 3} ещё
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Order Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Link
                href={`/orders/${order.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors group-hover:shadow-md"
              >
                <ExternalLink size={16} />
                Подробнее о заказе
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
