// components/AddToCartButton.tsx
'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string; // ✅ Правильное поле
    name: string;
    price: number;
    image: string;
  };
  disabled?: boolean;
}

export default function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id, // ✅ Правильное поле
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success(`${product.name} добавлен в корзину!`);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled}
      className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 px-6 text-sm font-medium hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <ShoppingBag size={18} />
      {disabled ? 'Нет в наличии' : 'В корзину'}
    </button>
  );
}