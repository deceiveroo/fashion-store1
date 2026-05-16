import { useEffect, useState } from 'react';

interface ViewedProduct {
  id: string;
  name: string;
  price: number;
  mainImage?: string;
  viewedAt: number;
}

const MAX_VIEWED = 20;
const STORAGE_KEY = 'recently_viewed_products';

export function useRecentlyViewed() {
  const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setViewedProducts(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing recently viewed:', e);
      }
    }
  }, []);

  // Add product to recently viewed
  const addViewedProduct = (product: Omit<ViewedProduct, 'viewedAt'>) => {
    setViewedProducts(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id);
      
      // Add to beginning
      const updated = [
        { ...product, viewedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_VIEWED);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
  };

  // Clear history
  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setViewedProducts([]);
  };

  return {
    viewedProducts,
    addViewedProduct,
    clearHistory,
  };
}
