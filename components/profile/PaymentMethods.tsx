'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, X, Check, Star } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  holderName?: string;
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2025, isDefault: true, holderName: 'IVAN PETROV' },
    { id: '2', type: 'card', last4: '5555', brand: 'Mastercard', expiryMonth: 6, expiryYear: 2026, isDefault: false, holderName: 'IVAN PETROV' },
    { id: '3', type: 'wallet', last4: '7890', brand: 'YooMoney', expiryMonth: 0, expiryYear: 0, isDefault: false },
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const getBrandIcon = (brand: string) => {
    const icons: Record<string, string> = {
      'Visa': '💳',
      'Mastercard': '💳',
      'Mir': '💳',
      'YooMoney': '💰',
      'QIWI': '💰',
    };
    return icons[brand] || '💳';
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'Visa': 'from-blue-500 to-blue-600',
      'Mastercard': 'from-orange-500 to-red-500',
      'Mir': 'from-green-500 to-emerald-600',
      'YooMoney': 'from-purple-500 to-purple-600',
      'QIWI': 'from-orange-500 to-yellow-500',
    };
    return colors[brand] || 'from-gray-500 to-gray-600';
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-emerald-200/50 dark:border-emerald-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
            <CreditCard className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Способы оплаты</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{paymentMethods.length} активных методов</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddCard(!showAddCard)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      {/* Add Card Form */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-white/50 dark:bg-gray-800/50 rounded-xl p-4"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Добавить новую карту</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Номер карты</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={newCard.number}
                  onChange={(e) => setNewCard({ ...newCard, number: formatCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16)) })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  maxLength={19}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Имя владельца</label>
                <input
                  type="text"
                  placeholder="IVAN PETROV"
                  value={newCard.holderName}
                  onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Месяц</label>
                  <input
                    type="text"
                    placeholder="12"
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Год</label>
                  <input
                    type="text"
                    placeholder="2025"
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                    maxLength={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">
                  Добавить карту
                </button>
                <button
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Methods List */}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <motion.div
            key={method.id}
            layout
            whileHover={{ scale: 1.02 }}
            className={`relative p-4 rounded-xl bg-gradient-to-br ${getBrandColor(method.brand)} text-white overflow-hidden`}
          >
            {/* Card Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getBrandIcon(method.brand)}</span>
                  <span className="font-semibold">{method.brand}</span>
                  {method.isDefault && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      По умолчанию
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removePaymentMethod(method.id)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-xl tracking-wider font-mono">
                  •••• •••• •••• {method.last4}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  {method.holderName && (
                    <p className="text-xs opacity-80 mb-1">Владелец</p>
                  )}
                  <p className="text-sm font-medium">{method.holderName || 'Электронный кошелек'}</p>
                </div>
                {method.type === 'card' && (
                  <div>
                    <p className="text-xs opacity-80 mb-1">Срок действия</p>
                    <p className="text-sm font-medium">
                      {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                    </p>
                  </div>
                )}
              </div>

              {!method.isDefault && (
                <button
                  onClick={() => setDefaultPaymentMethod(method.id)}
                  className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors"
                >
                  Сделать основным
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-2">
          <Check className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Все платежные данные надежно зашифрованы и защищены по стандарту PCI DSS. Мы не храним CVV коды.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
