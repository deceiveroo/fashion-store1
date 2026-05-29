'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

/**
 * Кнопка «Войти через Telegram». Вместо встраиваемого iframe-виджета (который не
 * рендерится на неавторизованных доменах и «пропадает» на localhost) используем
 * наш собственный брендовый button + Telegram.Login.auth() — попап авторизации.
 * Работает на домене, привязанном к боту через @BotFather /setdomain
 * (для нас — e1evate.vercel.app). На localhost попап покажет «Bot domain invalid»,
 * но кнопка всегда видна и единообразна.
 */
declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          opts: { bot_id: string; request_access?: boolean | string; lang?: string },
          cb: (user: Record<string, unknown> | false) => void
        ) => void;
      };
    };
  }
}

let widgetScriptPromise: Promise<void> | null = null;
function loadTelegramWidget(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Telegram?.Login) return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;
  widgetScriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('telegram-widget failed'));
    document.head.appendChild(s);
  });
  return widgetScriptPromise;
}

export default function TelegramLoginButton({
  onSuccess,
  disabled,
}: {
  onSuccess?: () => void;
  disabled?: boolean;
}) {
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (botId) loadTelegramWidget().catch(() => {});
  }, [botId]);

  // Бот не сконфигурирован — мягкий фолбэк.
  if (!botId) {
    return (
      <button
        type="button"
        disabled
        title="Telegram-вход активируется после настройки бота"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] py-3 text-sm font-medium text-[var(--text-secondary)] opacity-70"
      >
        <Send size={16} className="text-[#229ED9]" />
        Войти через Telegram
        <span className="text-[11px] opacity-70">— после настройки</span>
      </button>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      await loadTelegramWidget();
      if (!window.Telegram?.Login) {
        toast.error('Telegram-виджет недоступен');
        setLoading(false);
        return;
      }
      window.Telegram.Login.auth({ bot_id: botId, request_access: 'write' }, async (user) => {
        if (!user) {
          setLoading(false);
          return;
        }
        const res = await signIn('telegram', { ...user, redirect: false });
        if (res?.error) {
          toast.error('Не удалось войти через Telegram');
        } else {
          toast.success('Вход через Telegram выполнен');
          onSuccess?.();
        }
        setLoading(false);
      });
    } catch {
      toast.error('Ошибка загрузки Telegram');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: '#229ED9' }}
    >
      <Send size={17} />
      {loading ? 'Открываем Telegram…' : 'Войти через Telegram'}
    </button>
  );
}
