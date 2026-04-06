'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/Toaster';

const DynamicHeader = dynamic(() => import('@/components/Header'), {
  ssr: false,
  loading: () => <div className="h-16" />,
});
const DynamicFooter = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => null,
});

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') && pathname !== '/admin/login';

  if (isAdmin) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<div className="min-h-screen animate-pulse bg-gray-100" />}>
        <DynamicHeader />
        <main className="flex-1">{children}</main>
        <DynamicFooter />
        <Toaster />
      </Suspense>
    </>
  );
}