'use client';

import { useEffect, useState } from 'react';

/**
 * Кнопка входа через НОВЫЙ Telegram Login (telegram-login.js / OIDC).
 * Открывает попап Telegram и возвращает в callback подписанный id_token (JWT),
 * который сервер проверяет по JWKS Telegram. Старый telegram-widget.js (по
 * username + HMAC) и popup по bot_id — legacy/deprecated.
 *
 * Требования на стороне Telegram:
 *  - @BotFather → Bot Settings → Web Login → Trusted Origins → текущий origin
 *    (напр. https://e1evate.vercel.app). client_id = bot id.
 *  - Заголовок COOP не строже 'same-origin-allow-popups' (задан в middleware.ts).
 */
type TgAuthData = { id_token?: string; user?: Record<string, unknown>; error?: string };

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          opts: { client_id: number; request_access?: string[]; lang?: string; nonce?: string },
          cb: (data: TgAuthData) => void,
        ) => void;
        init?: (opts: unknown, cb: (data: TgAuthData) => void) => void;
        open?: (cb?: (data: TgAuthData) => void) => void;
      };
    };
  }
}

/** Фирменный логотип Telegram — кружок с градиентом + белый самолётик. */
export function TelegramGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <defs>
        <linearGradient id="tg-glyph-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#37BBFE" />
          <stop offset="100%" stopColor="#007DBB" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#tg-glyph-grad)" />
      <path
        fill="#fff"
        d="M5.491 11.74c3.5-1.525 5.834-2.53 7.001-3.016 3.333-1.386 4.026-1.627 4.477-1.635.099-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.094.036.307.02.474-.182 1.914-.97 6.557-1.37 8.7-.17.906-.504 1.21-.826 1.24-.701.064-1.233-.463-1.911-.908-1.062-.696-1.662-1.129-2.693-1.808-1.191-.785-.419-1.216.26-1.92.177-.184 3.262-2.99 3.322-3.244.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.8 1.144-5.084 3.36-.481.33-.917.491-1.308.483-.43-.01-1.259-.244-1.875-.444-.756-.245-1.356-.375-1.304-.792.027-.217.326-.439.897-.665Z"
      />
    </svg>
  );
}

let loginScript: Promise<void> | null = null;
function loadTelegramLogin(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Telegram?.Login) return Promise.resolve();
  if (loginScript) return loginScript;
  loginScript = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://oauth.telegram.org/js/telegram-login.js?5';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('telegram-login.js failed'));
    document.head.appendChild(s);
  });
  return loginScript;
}

export default function TelegramWidget({
  clientId,
  onAuth,
  onError,
  label = 'Войти через Telegram',
  compact = false,
}: {
  clientId: string | number;
  onAuth: (data: TgAuthData) => void;
  onError?: (msg: string) => void;
  label?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  // Предзагрузка библиотеки — чтобы попап открывался по клику без потери user-gesture.
  useEffect(() => {
    loadTelegramLogin().catch(() => {});
  }, []);

  const handleClick = async () => {
    setLoading(true);
    try {
      await loadTelegramLogin();
      const login = window.Telegram?.Login;
      if (!login?.auth) {
        onError?.('Виджет Telegram недоступен');
        setLoading(false);
        return;
      }
      login.auth({ client_id: Number(clientId), request_access: ['write'] }, (data) => {
        setLoading(false);
        if (data?.error) {
          onError?.(data.error);
          return;
        }
        if (data?.id_token) onAuth(data);
      });
    } catch {
      onError?.('Ошибка загрузки Telegram');
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] backdrop-blur-md transition-all hover:shadow disabled:opacity-60"
      >
        <TelegramGlyph size={15} />
        {loading ? '…' : 'Привязать'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] py-3 text-sm font-semibold text-[var(--foreground)] backdrop-blur-md transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <TelegramGlyph size={18} />
      {loading ? 'Открываем Telegram…' : label}
    </button>
  );
}
