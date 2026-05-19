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
        throw new Error('Failed to create support chat');
      }

      const data = await res.json();

      toast.success('✅ Запрос отправлен! Админ ответит в ближайшее время.');
      
      // Закрываем модалку и открываем чат
      onClose();
      
      // Можно добавить редирект на страницу чата или открыть виджет чата
      // window.dispatchEvent(new CustomEvent('open-chat', { detail: { sessionId: data.sessionId } }));
      
    } catch (error) {
      console.error('Error creating support chat:', error);
      toast.error('❌ Не удалось отправить запрос. Попробуйте позже.');
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
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
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Админ получит уведомление</p>
                <p className="text-xs opacity-80">
                  Ваш запрос будет отправлен в Telegram администратору. 
                  Ответ придёт в чат поддержки.
                </p>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Опишите вашу проблему
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Например: Когда будет доставлен заказ? / Хочу изменить адрес доставки..."
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSending}
              />
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
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
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
