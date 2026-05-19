'use client';

import { Heart } from 'lucide-react';
import { WishlistItem } from '@/app/profile/hooks/useProfileData';

interface WishlistSectionProps {
  wishlist: WishlistItem[];
  handleRemoveFromWishlist: (productId: string) => Promise<void>;
}

export default function WishlistSection({ wishlist, handleRemoveFromWishlist }: WishlistSectionProps) {
  if (wishlist.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Список избранного пуст</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {wishlist.map((item) => (
        <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex gap-4">
          {item.image && (
            <img src={item.image} alt={item.product.name} className="w-20 h-20 object-cover rounded-lg" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.product.name}</h4>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2">
              {item.product.price.toLocaleString('ru-RU')} ₽
            </p>
            <button
              onClick={() => handleRemoveFromWishlist(item.productId)}
              className="text-sm text-red-600 hover:underline"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
