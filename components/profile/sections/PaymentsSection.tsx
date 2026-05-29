'use client';

import { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { PaymentMethod } from '@/app/profile/hooks/useProfileData';
import Button from '@/components/ui/Button';

interface PaymentsSectionProps {
  paymentMethods: PaymentMethod[];
  showAddCard: boolean;
  setShowAddCard: (show: boolean) => void;
  newCard: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  setNewCard: (card: any) => void;
  handleAddCard: () => Promise<void>;
  handleRemovePaymentMethod: (methodId: string) => Promise<void>;
  handleSetDefaultPayment: (methodId: string) => Promise<void>;
}

export default function PaymentsSection({
  paymentMethods,
  showAddCard,
  setShowAddCard,
  newCard,
  setNewCard,
  handleAddCard,
  handleRemovePaymentMethod,
  handleSetDefaultPayment,
}: PaymentsSectionProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-[var(--foreground)]">Сохраненные карты</h4>
        <Button
          onClick={() => setShowAddCard(!showAddCard)}
          size="sm"
          icon={<Plus size={16} />}
        >
          Добавить
        </Button>
      </div>

      {showAddCard && (
        <div className="p-4 bg-[var(--fc-surface-elevated)] border border-[var(--fc-glass-border)] rounded-xl space-y-3">
          <input
            type="text"
            placeholder="Номер карты"
            value={newCard.number}
            onChange={(e) => setNewCard({ ...newCard, number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
            className="w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40"
          />
          <input
            type="text"
            placeholder="Имя владельца"
            value={newCard.holderName}
            onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value.toUpperCase() })}
            className="w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="ММ"
              value={newCard.expiryMonth}
              onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              className="w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40"
            />
            <input
              type="text"
              placeholder="ГГГГ"
              value={newCard.expiryYear}
              onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              className="w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40"
            />
            <input
              type="password"
              placeholder="CVV"
              value={newCard.cvv}
              onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              className="w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddCard} fullWidth>
              Добавить
            </Button>
            <Button variant="outline" onClick={() => setShowAddCard(false)} fullWidth>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {paymentMethods.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] py-4">Нет сохраненных способов оплаты</p>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className={`p-4 rounded-xl bg-gradient-to-br ${getBrandColor(method.brand)} text-white relative shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getBrandIcon(method.brand)}</span>
                  <span className="font-semibold">{method.brand}</span>
                  {method.isDefault && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs flex items-center gap-1">
                      <Star size={10} fill="currentColor" />
                      По умолчанию
                    </span>
                  )}
                </div>
                <button onClick={() => handleRemovePaymentMethod(method.id)} className="p-1 hover:bg-white/20 rounded">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xl font-mono mb-2">•••• •••• •••• {method.last4}</p>
              <div className="flex justify-between items-end">
                <p className="text-sm">{method.holderName}</p>
                {method.expiryMonth && method.expiryYear && (
                  <p className="text-sm">{String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}</p>
                )}
              </div>
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefaultPayment(method.id)}
                  className="mt-2 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
                >
                  Сделать основным
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
