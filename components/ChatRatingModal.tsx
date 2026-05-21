'use client';

import { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { toast } from 'sonner';

interface ChatRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSuccess?: () => void;
}

export default function ChatRatingModal({ isOpen, onClose, sessionId, onSuccess }: ChatRatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Пожалуйста, поставьте оценку');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/support-chats/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });

      if (res.ok) {
        toast.success('Спасибо за оценку!');
        onSuccess?.();
        onClose();
        setRating(0);
        setFeedback('');
      } else {
        toast.error('Ошибка при отправке оценки');
      }
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Ошибка при отправке оценки');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Оцените качество поддержки
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ваш отзыв поможет нам стать лучше
          </p>
        </div>

        {/* Rating Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-all hover:scale-110"
            >
              <Star
                className={`h-10 w-10 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Feedback Textarea */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Комментарий (необязательно)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Расскажите, что вам понравилось или не понравилось..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-xl font-medium hover:from-violet-500 hover:to-violet-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Отправить оценку
            </>
          )}
        </button>
      </div>
    </div>
  );
}
