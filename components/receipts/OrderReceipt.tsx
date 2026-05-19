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
      className="p-8 max-w-md mx-auto font-mono text-sm leading-relaxed"
      style={{ 
        fontFamily: 'Courier New, monospace',
        backgroundColor: '#ffffff',
        color: '#000000'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000000', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>ООО «ДипломБанк»</h1>
        <p style={{ fontSize: '12px' }}>ЭЛЕКТРОННЫЙ ЧЕК</p>
        <p style={{ fontSize: '12px' }}>О ПЛАТЕЖЕ</p>
      </div>

      {/* Receipt Details */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ color: '#6b7280' }}>Дата:</span>
          <span style={{ fontWeight: '600' }}>{formattedDate}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ color: '#6b7280' }}>Номер заказа:</span>
          <span style={{ fontWeight: '600' }}>#{order.id.substring(0, 8).toUpperCase()}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ color: '#6b7280' }}>Способ оплаты:</span>
          <span style={{ fontWeight: '600' }}>{paymentText}</span>
        </div>

        <div style={{ borderTop: '1px dashed #9ca3af', margin: '16px 0' }}></div>

        <div>
          <span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Плательщик:</span>
          <span style={{ fontWeight: '600' }}>
            {order.recipient ? `${order.recipient.firstName} ${order.recipient.lastName}`.trim() : '—'}
          </span>
        </div>

        <div>
          <span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email:</span>
          <span style={{ fontWeight: '600' }}>{order.recipient?.email || '—'}</span>
        </div>

        {order.recipient?.phone && (
          <div>
            <span style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Телефон:</span>
            <span style={{ fontWeight: '600' }}>{order.recipient.phone}</span>
          </div>
        )}

        <div style={{ borderTop: '1px dashed #9ca3af', margin: '16px 0' }}></div>

        {/* Items */}
        <div>
          <span style={{ color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Товары:</span>
          {order.items.map((item: OrderItem, index: number) => (
            <div key={index} style={{ fontSize: '12px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dotted #d1d5db' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</div>
              {(item.size || item.color) && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                  {item.size && <span>Размер: {item.size}</span>}
                  {item.size && item.color && <span>, </span>}
                  {item.color && <span>Цвет: {item.color}</span>}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                <span>{item.quantity} x {item.price.toLocaleString('ru-RU')} ₽</span>
                <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #9ca3af', margin: '16px 0' }}></div>

        {/* Total */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px' }}>
            <span>Подитог:</span>
            <span>{(order.total - order.deliveryPrice + order.discount).toLocaleString('ru-RU')} ₽</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '8px' }}>
              <span>Скидка:</span>
              <span>-{order.discount.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          {/* НДС 20% */}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px', fontSize: '11px' }}>
            <span>НДС (20%):</span>
            <span>{Math.round((order.total - order.deliveryPrice) * 0.20).toLocaleString('ru-RU')} ₽</span>
          </div>
          {order.deliveryPrice > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginBottom: '8px' }}>
              <span>Доставка:</span>
              <span>{order.deliveryPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '2px solid #000000' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ИТОГО:</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{order.total.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #9ca3af', margin: '16px 0' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Статус:</span>
          <span style={{ 
            fontWeight: '600',
            color: order.status === 'delivered' ? '#16a34a' :
                   order.status === 'cancelled' ? '#dc2626' :
                   '#2563eb'
          }}>
            {order.status === 'delivered' ? '✓ Выполнено' :
             order.status === 'cancelled' ? '✗ Отменено' :
             '⏳ В обработке'}
          </span>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ width: '128px', height: '128px', backgroundColor: '#f3f4f6', border: '2px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px' }}>
              {[...Array(25)].map((_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: Math.random() > 0.5 ? '#000000' : '#ffffff'
                  }}
                ></div>
              ))}
            </div>
            <p style={{ fontSize: '10px', color: '#6b7280' }}>QR-код</p>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div style={{ borderTop: '2px solid #000000', paddingTop: '16px', marginTop: '24px' }}>
        <p style={{ fontSize: '12px', textAlign: 'center', color: '#6b7280', lineHeight: '1.4' }}>
          Документ сформирован в учебных целях.<br />
          Не является платёжным документом.
        </p>
        <p style={{ fontSize: '10px', textAlign: 'center', color: '#6b7280', marginTop: '8px' }}>
          ID: {order.id.slice(0, 8)}
        </p>
      </div>
    </div>
  );
}
