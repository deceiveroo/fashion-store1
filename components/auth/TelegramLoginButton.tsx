'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

/**
 * Telegram Login Widget → NextAuth-провайдер 'telegram' (реальная сессия).
 * Виджет требует публичный домен + бот, зарегистрированный у @BotFather (/setdomain),
 * поэтому на localhost он не активен — показываем брендовую кнопку-заглушку
 * «доступно после деплоя». Имя бота берём из NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.
 */
type Props = {
  onSuccess?: () => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export default function TelegramLoginButton({ onSuccess, disabled }: Props) {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    window.onTelegramAuth = async (user) => {
      setLoading(true);
      try {
        const res = await signIn('telegram', { ...user, redirect: false });
        if (res?.error) {
          toast.error('Не удалось войти через Telegram');
        } else {
          toast.success('Вход через Telegram выполнен');
          onSuccess?.();
        }
      } catch {
        toast.error('Ошибка входа через Telegram');
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    const container = containerRef.current;
    container.innerHTML = '';
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      delete window.onTelegramAuth;
    };
  }, [botUsername, onSuccess]);

  // Фолбэк: бот не сконфигурирован (например, локальная разработка).
  if (!botUsername) {
    return (
      <button
        type="button"
        disabled
        title="Telegram-вход доступен на опубликованном сайте (нужен публичный домен и бот)"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] py-3 text-sm font-medium text-[var(--text-secondary)] opacity-70"
      >
        <Send size={16} className="text-[#229ED9]" />
        Войти через Telegram
        <span className="text-[11px] opacity-70">— после деплоя</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {loading && <span className="text-xs text-[var(--text-secondary)]">Входим через Telegram…</span>}
      <div ref={containerRef} className={disabled ? 'pointer-events-none opacity-60' : ''} />
    </div>
  );
}
