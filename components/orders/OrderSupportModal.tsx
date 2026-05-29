'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderSupportModalProps {
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
}

export default function OrderSupportModal({ orderId, orderNumber, onClose }: OrderSupportModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Введите сообщение');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/order-support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderNumber: orderNumber || orderId.slice(0, 8).toUpperCase(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create support chat');
      }

      const data = await res.json();

      toast.success('✅ Запрос отправлен! Админ ответит в ближайшее время.');

      // Закрываем модалку и открываем чат
      onClose();

      // Можно добавить редирект на страницу чата или открыть виджет чата
      // window.dispatchEvent(new CustomEvent('open-chat', { detail: { sessionId: data.sessionId } }));

    } catch (error) {
      console.error('Error creating support chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось отправить запрос. Попробуйте позже.';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="fc-glass-card relative max-w-lg w-full !rounded-3xl border border-[var(--fc-glass-border)] shadow-[var(--fc-shadow-lifted)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-6"
            style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Поддержка по заказу</h3>
                  <p className="text-sm text-white/80">
                    #{orderNumber || orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Info Banner */}
            <div className="flex gap-3 p-4 rounded-xl border border-[rgba(var(--fc-accent-rgb)/0.25)] bg-[rgba(var(--fc-accent-rgb)/0.08)]">
              <AlertCircle className="w-5 h-5 text-[var(--fc-accent)] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--foreground)]">
                <p className="font-semibold mb-1">Админ получит уведомление</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Ваш запрос будет отправлен в Telegram администратору.
                  Ответ придёт в чат поддержки.
                </p>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Опишите вашу проблему
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Например: Когда будет доставлен заказ? / Хочу изменить адрес доставки..."
                rows={5}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--fc-glass-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-accent)] focus:border-transparent resize-none transition-shadow"
                disabled={isSending}
              />
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                Быстрые шаблоны:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Где мой заказ?',
                  'Хочу отменить заказ',
                  'Изменить адрес доставки',
                  'Проблема с оплатой',
                ].map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setMessage(template)}
                    disabled={isSending}
                    className="px-3 py-1.5 text-xs bg-[var(--fc-surface)] border border-[var(--fc-glass-border)] text-[var(--text-secondary)] rounded-lg hover:bg-[rgba(var(--fc-accent-rgb)/0.12)] hover:text-[var(--fc-accent)] hover:border-[rgba(var(--fc-accent-rgb)/0.3)] transition-colors disabled:opacity-50"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              style={{ backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.98]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Отправить запрос</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
