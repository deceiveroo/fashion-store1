'use client';

import { Receipt } from '@/lib/receipt-client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ReceiptPreviewProps {
  receipt: Receipt;
}

export default function ReceiptPreview({ receipt }: ReceiptPreviewProps) {
  const formattedDate = format(new Date(receipt.created_at), 'dd.MM.yyyy HH:mm', { locale: ru });
  const paymentMethodText = {
    card: 'Банковская карта',
    sbp: 'СБП (Система быстрых платежей)',
    cash: 'Наличные'
  }[receipt.payment_method] || receipt.payment_method;

  return (
    <div 
      id="receipt-preview"
      className="bg-white text-black p-8 max-w-md mx-auto font-mono text-sm leading-relaxed"
      style={{ fontFamily: 'Courier New, monospace' }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-xl font-bold mb-2">{receipt.bank_name}</h1>
        <p className="text-xs">ЭЛЕКТРОННЫЙ ЧЕК</p>
        <p className="text-xs">О ПЛАТЕЖЕ</p>
      </div>

      {/* Receipt Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Дата:</span>
          <span className="font-semibold">{formattedDate}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Номер заказа:</span>
          <span className="font-semibold">{receipt.order_number}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Способ оплаты:</span>
          <span className="font-semibold">{paymentMethodText}</span>
        </div>

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        <div>
          <span className="text-gray-600 block mb-1">Плательщик:</span>
          <span className="font-semibold">{receipt.payer_name}</span>
        </div>

        {receipt.description && (
          <div>
            <span className="text-gray-600 block mb-1">Назначение:</span>
            <span className="font-semibold">{receipt.description}</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">СУММА:</span>
          <span className="text-2xl font-bold">{receipt.amount.toLocaleString('ru-RU')} ₽</span>
        </div>

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        <div className="flex justify-between">
          <span className="text-gray-600">Статус:</span>
          <span className={`font-semibold ${
            receipt.status === 'completed' ? 'text-green-600' :
            receipt.status === 'pending' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {receipt.status === 'completed' ? '✓ Выполнено' :
             receipt.status === 'pending' ? '⏳ В обработке' :
             '✗ Отклонено'}
          </span>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 bg-gray-100 border-2 border-black flex items-center justify-center">
          <div className="text-center">
            <div className="grid grid-cols-5 gap-1 mb-2">
              {[...Array(25)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                ></div>
              ))}
            </div>
            <p className="text-[10px] text-gray-600">QR-код</p>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="border-t-2 border-black pt-4 mt-6">
        <p className="text-xs text-center text-gray-600 leading-tight">
          Документ сформирован в учебных целях.<br />
          Не является платёжным документом.
        </p>
        <p className="text-[10px] text-center text-gray-500 mt-2">
          ID: {receipt.id.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}
