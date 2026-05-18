'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ShonheiiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('Проверка доступа...');

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      setMessage('❌ Доступ запрещен. Требуется авторизация.');
      setTimeout(() => {
        router.push('/auth/signin?callbackUrl=/shonheii');
      }, 2000);
      return;
    }

    // Проверяем роль
    const userRole = session?.user?.role as string;
    
    if (userRole === 'admin' || userRole === 'manager') {
      setMessage('✅ Доступ разрешен! Перенаправление в админку...');
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1000);
    } else {
      setMessage(`❌ Доступ запрещен. Ваша роль: ${userRole}. Требуются права admin или manager.`);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-violet-950/20 to-gray-950">
      <div className="text-center space-y-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
          <h1 className="relative text-6xl font-bold text-white mb-4 tracking-tight">
            SHONHEII
          </h1>
        </div>
        
        <div className="space-y-4">
          <p className="text-lg text-white/70">{message}</p>
          
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent" />
            </div>
          )}
          
          {status === 'authenticated' && (
            <div className="text-sm text-white/50">
              <p>Email: {session.user?.email}</p>
              <p>Роль: {session.user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
