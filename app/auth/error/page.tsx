// app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Проблема с конфигурацией сервера.';
      case 'AccessDenied':
        return 'Доступ запрещён.';
      case 'Verification':
        return 'Ссылка подтверждения истекла или уже была использована.';
      default:
        return 'При входе произошла ошибка.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-[var(--foreground)]">Ошибка входа</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">{getErrorMessage(error)}</p>
        </div>
        <a
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{ backgroundImage: 'linear-gradient(135deg,#8b7cf6,#c4b5fd)' }}
        >
          Попробовать снова
        </a>
      </div>
    </div>
  );
}
