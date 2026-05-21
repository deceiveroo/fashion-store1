'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import StarRating from './StarRating';

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (rating === 0) {
      toast.error('Пожалуйста, выберите рейтинг');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Отзыв должен содержать минимум 10 символов');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title || undefined,
          comment,
          images: images.length > 0 ? images : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Отзыв успешно отправлен! Он появится после модерации.', {
        icon: '🎉',
      });

      // Сброс формы
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при отправке отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Максимум 4 фото
    if (images.length + files.length > 4) {
      toast.error('Можно загрузить максимум 4 фото');
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Можно загружать только изображения');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Написать отзыв</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ваша оценка *
          </label>
          <div className="flex items-center gap-4">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
            {rating > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {rating === 5 && 'Отлично! ⭐'}
                {rating === 4 && 'Хорошо 👍'}
                {rating === 3 && 'Нормально 😐'}
                {rating === 2 && 'Плохо 👎'}
                {rating === 1 && 'Ужасно 😞'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Заголовок (необязательно)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Кратко опишите ваше впечатление"
            maxLength={100}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ваш отзыв *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Расскажите подробнее о товаре: качество, размер, посадка..."
            rows={5}
            minLength={10}
            maxLength={1000}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>Минимум 10 символов</span>
            <span>{comment.length}/1000</span>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Фотографии (максимум 4)
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 group"
                >
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {images.length < 4 && (
              <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-violet-500 dark:hover:border-violet-500 cursor-pointer transition-colors bg-gray-50 dark:bg-gray-700/50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Добавить фото</span>
              </label>
            )}
          </div>

          {images.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Фото помогут другим покупателям (+25 XP бонус)
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Информация о модерации</p>
              <p>Ваш отзыв будет опубликован после проверки модератором (обычно в течение 24 часов).</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Отправка...
              </span>
            ) : (
              'Отправить отзыв'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
