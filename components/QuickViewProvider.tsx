'use client';

import { useState, useEffect } from 'react';
import QuickViewModal from './QuickViewModal';

export default function QuickViewProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  useEffect(() => {
    const handleQuickView = (event: CustomEvent) => {
      setProductId(event.detail.productId);
      setIsOpen(true);
    };

    window.addEventListener('quickView', handleQuickView as EventListener);
    
    return () => {
      window.removeEventListener('quickView', handleQuickView as EventListener);
    };
  }, []);

  return (
    <QuickViewModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      productId={productId}
    />
  );
}
