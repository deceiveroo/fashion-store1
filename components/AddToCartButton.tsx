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
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 px-6 text-sm font-medium tracking-wide hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
    >
      <ShoppingBag size={18} aria-hidden />
      {disabled ? 'Нет в наличии' : 'В корзину'}
    </button>
  );
}
