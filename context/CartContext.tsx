'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode
} from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'INIT_FROM_STORAGE'; payload: CartItem[] };

// 🧠 Вспомогательная функция для округления
const roundToInteger = (num: number): number => {
  return Math.round(num);
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  // console.log('🛒 Cart Action:', action.type, 'payload' in action ? action.payload : 'no payload');

  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);

      if (existingItem) {
        const newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
          items: newItems,
          total: roundToInteger(newTotal), // ✅ Округление
          itemCount: newItemCount
        };
      }

      const newItem: CartItem = { ...action.payload, quantity: 1 };
      const updatedItems = [...state.items, newItem];
      const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const updatedCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: updatedItems,
        total: roundToInteger(updatedTotal), // ✅ Округление
        itemCount: updatedCount
      };

    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      const filteredTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const filteredCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: filteredItems,
        total: roundToInteger(filteredTotal), // ✅ Округление
        itemCount: filteredCount
      };

    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        const filteredItems = state.items.filter(item => item.id !== action.payload.id);
        const filteredTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const filteredCount = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          items: filteredItems,
          total: roundToInteger(filteredTotal),
          itemCount: filteredCount
        };
      }

      const quantityUpdatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      
      const quantityUpdatedTotal = quantityUpdatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const quantityUpdatedCount = quantityUpdatedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: quantityUpdatedItems,
        total: roundToInteger(quantityUpdatedTotal), // ✅ Округление
        itemCount: quantityUpdatedCount
      };

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    case 'INIT_FROM_STORAGE':
      const loadedTotal = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const loadedCount = action.payload.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: action.payload,
        total: roundToInteger(loadedTotal), // ✅ Округление
        itemCount: loadedCount
      };

    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
} | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  });
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'INIT_FROM_STORAGE', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Sync cart with user account when user logs in
  useEffect(() => {
    if (user && !isLoading) {
      // Load user's saved cart from localStorage
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: 'INIT_FROM_STORAGE', payload: parsedCart });
        } catch (error) {
          console.error('Error loading user cart:', error);
        }
      }
    } else if (!user && !isLoading) {
      // User logged out, load guest cart
      const guestCart = localStorage.getItem('cart');
      if (guestCart) {
        try {
          const parsedCart = JSON.parse(guestCart);
          dispatch({ type: 'INIT_FROM_STORAGE', payload: parsedCart });
        } catch (error) {
          console.error('Error loading guest cart:', error);
        }
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user) {
      // Save to user-specific cart
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(state.items));
    } else {
      // Save to guest cart
      localStorage.setItem('cart', JSON.stringify(state.items));
    }
  }, [state.items, user]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    // console.log('🛒 addItem called with:', item);
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};