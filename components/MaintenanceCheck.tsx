'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MaintenancePage from '@/app/maintenance/page';

interface MaintenanceStatus {
  maintenanceMode: boolean;
}

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Check if user is admin/manager (can always access site)
  const isAdmin = status === 'authenticated' && 
    ['admin', 'manager'].includes(session?.user?.role as string);

  // Skip check for admin routes, maintenance page, and admins
  const isExemptPath = 
    pathname?.startsWith('/admin') ||
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
      fetch('/api/maintenance/status', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data: MaintenanceStatus) => {
          console.log('Maintenance status:', data.maintenanceMode);
          setIsMaintenanceMode(data.maintenanceMode);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error checking maintenance status:', error);
          setIsLoading(false);
        });
    };

    checkStatus();
    
    // Refresh every 30 seconds to catch status changes
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isExemptPath, isAdmin]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  // Show maintenance page only for non-admin users when mode is enabled
  if (isMaintenanceMode && !isExemptPath && !isAdmin) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
