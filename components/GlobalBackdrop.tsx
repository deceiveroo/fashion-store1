'use client';

import { useEffect, useState } from 'react';

export default function GlobalBackdrop() {
  const [activeBackdrops, setActiveBackdrops] = useState<{
    cart: boolean;
    userMenu: boolean;
    search: boolean;
    chat: boolean;
  }>({
    cart: false,
    userMenu: false,
    search: false,
    chat: false,
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

    // Listen for search state changes
    const handleSearchStateChange = (e: CustomEvent) => {
      setActiveBackdrops(prev => ({
        ...prev,
        search: e.detail.isOpen,
      }));
    };

    // Listen for chat state changes
    const handleChatStateChange = (e: CustomEvent) => {
      setActiveBackdrops(prev => ({
        ...prev,
        chat: e.detail.isOpen,
      }));
    };

    window.addEventListener('cartStateChange', handleCartStateChange as EventListener);
    window.addEventListener('userMenuStateChange', handleUserMenuStateChange as EventListener);
    window.addEventListener('searchStateChange', handleSearchStateChange as EventListener);
    window.addEventListener('chatStateChange', handleChatStateChange as EventListener);

    return () => {
      window.removeEventListener('cartStateChange', handleCartStateChange as EventListener);
      window.removeEventListener('userMenuStateChange', handleUserMenuStateChange as EventListener);
      window.removeEventListener('searchStateChange', handleSearchStateChange as EventListener);
      window.removeEventListener('chatStateChange', handleChatStateChange as EventListener);
    };
  }, []);

  // Don't render if no backdrops are active
  if (!activeBackdrops.cart && !activeBackdrops.userMenu && !activeBackdrops.search && !activeBackdrops.chat) {
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
        if (activeBackdrops.search) {
          window.dispatchEvent(new CustomEvent('closeSearch'));
        }
        if (activeBackdrops.chat) {
          window.dispatchEvent(new CustomEvent('closeChat'));
        }
      }}
      aria-hidden="true"
    />
  );
}
