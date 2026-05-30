'use client';

import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  size?: string;
  color?: string;
  disabled?: boolean;
}

export default function AddToCartButton({ product, size, color, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // Проверка обязательного размера
    if (!size) {
      toast.error('⚠️ Выберите размер перед добавлением в корзину');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: size,
      color: color,
    });
    
    const sizeText = size ? ` (Размер: ${size})` : '';
    const colorText = color ? `, Цвет: ${color}` : '';
    toast.success(`${product.name}${sizeText}${colorText} добавлен в корзину`);
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={disabled}
      className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed ${
        disabled
          ? 'bg-gray-200 text-gray-400 dark:bg-neutral-800 dark:text-neutral-600'
          : 'pdp-accent-gradient text-white shadow-[0_10px_28px_-8px_rgba(124,58,237,0.45)] hover:brightness-105'
      }`}
    >
      <ShoppingBag size={18} aria-hidden />
      <span>{disabled ? 'Нет в наличии' : 'В корзину'}</span>
    </button>
  );
}
