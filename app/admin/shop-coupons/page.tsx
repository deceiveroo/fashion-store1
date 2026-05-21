'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopCouponsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/coupons');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Перенаправление...</p>
      </div>
    </div>
  );
}
