'use client';

import { Order, OrderItem } from '@/app/orders/page';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OrderReceiptProps {
  order: Order;
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  const formattedDate = format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru });
  const paymentMethodText: Record<string, string> = {
    card: 'Банковская карта',
    sbp: 'СБП (Система быстрых платежей)',
    cash: 'Наличные'
  };
  const paymentText = paymentMethodText[order.paymentMethod] || order.paymentMethod;

  return (
    <div 
      id="order-receipt"
      className="bg-white text-black p-8 max-w-md mx-auto font-mono text-sm leading-relaxed"
      style={{ fontFamily: 'Courier New, monospace' }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-xl font-bold mb-2">ООО «ДипломБанк»</h1>
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
          <span className="font-semibold">#{order.id.substring(0, 8).toUpperCase()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Способ оплаты:</span>
          <span className="font-semibold">{paymentText}</span>
        </div>

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        <div>
          <span className="text-gray-600 block mb-1">Плательщик:</span>
          <span className="font-semibold">
            {order.recipient ? `${order.recipient.firstName} ${order.recipient.lastName}`.trim() : '—'}
          </span>
        </div>

        <div>
          <span className="text-gray-600 block mb-1">Email:</span>
          <span className="font-semibold">{order.recipient?.email || '—'}</span>
        </div>

        {order.recipient?.phone && (
          <div>
            <span className="text-gray-600 block mb-1">Телефон:</span>
            <span className="font-semibold">{order.recipient.phone}</span>
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        {/* Items */}
        <div className="space-y-2">
          <span className="text-gray-600 font-semibold block mb-2">Товары:</span>
          {order.items.map((item: OrderItem, index: number) => (
            <div key={index} className="text-xs">
              <div className="font-semibold">{item.name}</div>
              <div className="flex justify-between text-gray-600">
                <span>{item.quantity} x {item.price.toLocaleString('ru-RU')} ₽</span>
                <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        {/* Total */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Подитог:</span>
            <span>{(order.total - order.deliveryPrice + order.discount).toLocaleString('ru-RU')} ₽</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Скидка:</span>
              <span>-{order.discount.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          {order.deliveryPrice > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Доставка:</span>
              <span>{order.deliveryPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t-2 border-black">
            <span className="text-lg font-bold">ИТОГО:</span>
            <span className="text-2xl font-bold">{order.total.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        <div className="flex justify-between">
          <span className="text-gray-600">Статус:</span>
          <span className={`font-semibold ${
            order.status === 'delivered' ? 'text-green-600' :
            order.status === 'cancelled' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {order.status === 'delivered' ? '✓ Выполнено' :
             order.status === 'cancelled' ? '✗ Отменено' :
             '⏳ В обработке'}
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
          ID: {order.id.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}
