'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import MaintenancePage from '@/app/maintenance/page';

interface MaintenanceStatus {
  maintenanceMode: boolean;
}

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Skip check for admin routes and maintenance page itself
  const isExemptPath = 
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/api/') ||
    pathname?.startsWith('/maintenance');

  useEffect(() => {
    if (isExemptPath) {
      setIsLoading(false);
      return;
    }

    // Check maintenance status
    fetch('/api/maintenance/status')
      .then((res) => res.json())
      .then((data: MaintenanceStatus) => {
        setIsMaintenanceMode(data.maintenanceMode);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error checking maintenance status:', error);
        setIsLoading(false);
      });
  }, [isExemptPath]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (isMaintenanceMode && !isExemptPath) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
