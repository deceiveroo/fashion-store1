'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export default function AdminSegmentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated' && !hasRedirected) {
      setHasRedirected(true);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect if authenticated but not admin/manager
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'manager' && !hasRedirected) {
      console.log('[Admin Layout] Unauthorized access attempt by user:', session.user.email, 'with role:', session.user.role);
      setHasRedirected(true);
      // Check maintenance mode and redirect accordingly
      fetch('/api/maintenance/status', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.maintenanceMode) {
            router.push('/maintenance');
          } else {
            router.push('/');
          }
        })
        .catch(() => {
          router.push('/');
        });
    }
  }, [status, router, pathname, hasRedirected, session]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <ConfirmProvider>
      {children}
    </ConfirmProvider>
  );
}