'use client';

import { useEffect, useState } from 'react';

export default function GlobalBackdrop() {
  const [activeBackdrops, setActiveBackdrops] = useState<{
    cart: boolean;
    userMenu: boolean;
  }>({
    cart: false,
    userMenu: false,
  });

  useEffect(() => {
    // Listen for cart state changes
    const handleCartStateChange = (e: CustomEvent) => {
      setActiveBackdrops(prev => ({
        ...prev,
        cart: e.detail.isOpen,
      }));
    };

    // Listen for user menu state changes
    const handleUserMenuStateChange = (e: CustomEvent) => {
      setActiveBackdrops(prev => ({
        ...prev,
        userMenu: e.detail.isOpen,
      }));
    };

    window.addEventListener('cartStateChange', handleCartStateChange as EventListener);
    window.addEventListener('userMenuStateChange', handleUserMenuStateChange as EventListener);

    return () => {
      window.removeEventListener('cartStateChange', handleCartStateChange as EventListener);
      window.removeEventListener('userMenuStateChange', handleUserMenuStateChange as EventListener);
    };
  }, []);

  // Don't render if no backdrops are active
  if (!activeBackdrops.cart && !activeBackdrops.userMenu) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-transparent"
      onClick={() => {
        // Close all open panels
        if (activeBackdrops.cart) {
          window.dispatchEvent(new CustomEvent('closeCart'));
        }
        if (activeBackdrops.userMenu) {
          window.dispatchEvent(new CustomEvent('closeUserMenu'));
        }
      }}
      aria-hidden="true"
    />
  );
}
