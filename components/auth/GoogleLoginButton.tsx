'use client';

import { useEffect, useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';

/**
 * Кнопка «Продолжить с Google». Доступность определяется автоматически через
 * getProviders() — провайдер google регистрируется в lib/auth.ts только при наличии
 * GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET. Пока ключей нет — кнопка в состоянии
 * «после настройки» (без extra env-флагов).
 */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C39.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function GoogleLoginButton({ disabled }: { disabled?: boolean }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getProviders()
      .then((p) => active && setAvailable(Boolean(p && 'google' in p)))
      .catch(() => active && setAvailable(false));
    return () => {
      active = false;
    };
  }, []);

  const handleClick = () => {
    setLoading(true);
    // OAuth — полный редирект; возвращаемся на текущую страницу.
    const callbackUrl = typeof window !== 'undefined' ? window.location.href : '/';
    signIn('google', { callbackUrl });
  };

  if (available === false) {
    return (
      <button
        type="button"
        disabled
        title="Google-вход активируется после добавления GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] py-3 text-sm font-medium text-[var(--text-secondary)] opacity-70"
      >
        <GoogleIcon />
        Продолжить с Google
        <span className="text-[11px] opacity-70">— после настройки</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || available === null}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] py-3 text-sm font-semibold text-[var(--foreground)] backdrop-blur-md transition-all hover:shadow-md disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? 'Переходим в Google…' : 'Продолжить с Google'}
    </button>
  );
}
