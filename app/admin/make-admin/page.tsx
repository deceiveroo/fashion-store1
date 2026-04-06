'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MakeAdminPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsError(false);
        // Через 2 секунды перенаправляем на главную страницу админки
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setMessage(data.error);
        setIsError(true);
      }
    } catch (error) {
      setMessage('Произошла ошибка при попытке обновить роль пользователя');
      setIsError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 to-zinc-100 px-4 dark:from-zinc-900 dark:to-violet-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Назначение администратора</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Введите email пользователя, которому нужно назначить роль администратора
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Email пользователя
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              placeholder="user@example.com"
              required
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Назначить администратором
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${isError ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200' : 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200'}`}>
            {message}
          </div>
        )}

        <div className="mt-8">
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            После назначения роли администратора пользователь сможет получить доступ к админ-панели
          </p>
        </div>
      </div>
    </div>
  );
}