'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ticket, Clock } from 'lucide-react';
import { UserCoupon } from '@/app/profile/hooks/useProfileData';
import { Loader } from 'lucide-react';

interface CouponsSectionProps {
  coupons: UserCoupon[];
  isLoadingData: boolean;
}

export default function CouponsSection({ coupons, isLoadingData }: CouponsSectionProps) {
  if (isLoadingData) {
    return (
      <div className="text-center py-8">
        <Loader className="animate-spin mx-auto text-purple-600 mb-4" size={48} />
        <p className="text-gray-600 dark:text-gray-400">Загрузка промокодов...</p>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-8">
        <Ticket size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">У вас пока нет использованных промокодов</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Промокоды появятся здесь после использования при оформлении заказа</p>
      </div>
    );
  }

  return (
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
  );
}
