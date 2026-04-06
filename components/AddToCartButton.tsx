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
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleAddToCart}
      disabled={disabled}
      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <ShoppingBag size={20} />
      {disabled ? 'Нет в наличии' : 'В корзину'}
    </motion.button>
  );
}