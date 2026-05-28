'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MaintenancePage from '@/app/maintenance/page';

interface MaintenanceStatus {
  maintenanceMode: boolean;
}

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is admin/manager (can always access site)
  const isAdmin = status === 'authenticated' && 
    ['admin', 'manager'].includes(session?.user?.role as string);

  // Skip check for maintenance page and API routes only
  const isExemptPath = 
    pathname?.startsWith('/api/') ||
    pathname?.startsWith('/maintenance');

  useEffect(() => {
    // Admins can always access everything
    if (isAdmin) {
      setIsLoading(false);
      return;
    }

    if (isExemptPath) {
      setIsLoading(false);
      return;
    }

    // Check maintenance status for non-admin users
    const checkStatus = () => {
      // Убрали cache: 'no-store' — сервер сам кеширует на 60 сек.
      // Polling — 5 минут (раньше 30 сек = 120 запросов/час).
      fetch('/api/maintenance/status')
        .then((res) => res.json())
        .then((data: MaintenanceStatus) => {
          setIsMaintenanceMode(data.maintenanceMode);

          // If maintenance mode is ON and user is on admin page, redirect to maintenance
          if (data.maintenanceMode && pathname?.startsWith('/admin')) {
            router.push('/maintenance');
          }

          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error checking maintenance status:', error);
          setIsLoading(false);
        });
    };

    checkStatus();

    // Refresh every 5 minutes (раньше 30 сек = слишком часто для редко меняющегося поля)
    const interval = setInterval(checkStatus, 5 * 60_000);

    return () => clearInterval(interval);
  }, [isExemptPath, isAdmin, pathname, router]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  // Show maintenance page only for non-admin users when mode is enabled
  if (isMaintenanceMode && !isExemptPath && !isAdmin) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
