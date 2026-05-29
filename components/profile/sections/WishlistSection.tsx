'use client';

import { Heart, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { WishlistItem } from '@/app/profile/hooks/useProfileData';
import ProxyImage from '@/components/ProxyImage';
import Button from '@/components/ui/Button';

interface WishlistSectionProps {
  wishlist: WishlistItem[];
  handleRemoveFromWishlist: (productId: string) => Promise<void>;
}

export default function WishlistSection({ wishlist, handleRemoveFromWishlist }: WishlistSectionProps) {
  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={64} className="mx-auto text-[#8b7cf6]/40 mb-4" />
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Список избранного пуст
        </h3>
        <p className="text-[var(--text-secondary)]">
          Добавьте товары в избранное, чтобы быстро найти их позже
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {wishlist.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="fc-glass-card group relative overflow-hidden hover:shadow-xl transition-all duration-300"
        >
          {/* Product Image */}
          <Link href={`/products/${item.productId}`} className="block">
            <div className="relative aspect-square overflow-hidden">
              {item.image ? (
                <ProxyImage
                  src={item.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  proxyWidth={384}
                />
              ) : (
                <div className="w-full h-full bg-[var(--fc-surface-elevated)] flex items-center justify-center">
                  <Heart size={48} className="text-[#8b7cf6]/40" />
                </div>
              )}
              
              {/* Quick View Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--fc-surface-elevated)] border border-[var(--fc-glass-border)] backdrop-blur-md rounded-full text-sm font-semibold text-[var(--foreground)] shadow-lg">
                    <ExternalLink size={16} className="text-[#8b7cf6]" />
                    Смотреть товар
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Product Info */}
          <div className="p-4">
            <Link href={`/products/${item.productId}`} className="block">
              <h4 className="font-semibold text-[var(--foreground)] mb-2 line-clamp-2 group-hover:text-[#8b7cf6] transition-colors">
                {item.product.name}
              </h4>
            </Link>

            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-[#8b7cf6]">
                {item.product.price.toLocaleString('ru-RU')} ₽
              </p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFromWishlist(item.productId)}
                title="Удалить из избранного"
                aria-label="Удалить из избранного"
                className="!px-2 text-rose-500 hover:text-rose-600 hover:!bg-rose-500/10"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
