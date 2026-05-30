'use client';

import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';

/**
 * Кнопка входа через НОВЫЙ Telegram Login (telegram-login.js / OIDC).
 * Открывает попап Telegram и возвращает в callback подписанный id_token (JWT),
 * который сервер проверяет по JWKS Telegram. Старый telegram-widget.js (по
 * username + HMAC) и popup по bot_id — legacy/deprecated.
 *
 * Требования на стороне Telegram:
 *  - @BotFather → Bot Settings → Web Login → добавить Allowed URL текущего origin
 *    (напр. https://e1evate.vercel.app). client_id = bot id.
 *  - Заголовок COOP не строже 'same-origin-allow-popups' (задан в middleware.ts),
 *    иначе попап не сможет обменяться данными с окном.
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
        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow transition-all hover:shadow-md disabled:opacity-60"
        style={{ backgroundColor: '#229ED9' }}
      >
        <Send size={14} />
        {loading ? '…' : 'Привязать'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="tg-auth-button flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: '#229ED9' }}
    >
      <Send size={17} />
      {loading ? 'Открываем Telegram…' : label}
    </button>
  );
}
