'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import TelegramWidget from './TelegramWidget';

/**
 * Вход через Telegram официальным встраиваемым виджетом (data-telegram-login).
 * Старый Telegram.Login.auth({bot_id}) popup (oauth.telegram.org/auth) Telegram
 * пометил как DEPRECATED — поэтому используем виджет по username бота.
 *
 * Доступность определяется в РАНТАЙМЕ через /api/auth/telegram-config (читает
 * серверные env), поэтому не зависит от build-time NEXT_PUBLIC_*.
 * ВАЖНО: домен страницы входа должен быть привязан к боту в @BotFather (/setdomain),
 * иначе виджет покажет «Bot domain invalid».
 */
export default function TelegramLoginButton({ onSuccess }: { onSuccess?: () => void; disabled?: boolean }) {
  const [config, setConfig] = useState<{ enabled: boolean; botUsername: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/telegram-config')
      .then((r) => (r.ok ? r.json() : { enabled: false, botUsername: null }))
      .then((c) => active && setConfig(c))
      .catch(() => active && setConfig({ enabled: false, botUsername: null }));
    return () => {
      active = false;
    };
  }, []);

  const handleAuth = useCallback(
    async (user: Record<string, unknown>) => {
      const res = await signIn('telegram', { ...user, redirect: false });
      if (res?.error) {
        toast.error('Не удалось войти через Telegram');
      } else {
        toast.success('Вход через Telegram выполнен');
        onSuccess?.();
      }
    },
    [onSuccess],
  );

  // Загрузка / бот не сконфигурирован — мягкий фолбэк.
  if (config === null || !config.enabled || !config.botUsername) {
    return (
      <button
        type="button"
        disabled
        title={config === null ? 'Загрузка…' : 'Telegram-вход активируется после настройки бота'}
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] py-3 text-sm font-medium text-[var(--text-secondary)] opacity-70"
      >
        <Send size={16} className="text-[#229ED9]" />
        Войти через Telegram
        {config !== null && <span className="text-[11px] opacity-70">— после настройки</span>}
      </button>
    );
  }

  return (
    <div className="flex w-full justify-center">
      <TelegramWidget botUsername={config.botUsername} onAuth={handleAuth} />
    </div>
  );
}
