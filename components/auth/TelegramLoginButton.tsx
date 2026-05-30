'use client';

import { useCallback, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import TelegramWidget from './TelegramWidget';

/**
 * Вход через новый Telegram Login (telegram-login.js / OIDC). Виджет возвращает
 * id_token, который мы передаём в NextAuth-провайдер 'telegram' (там он проверяется
 * по JWKS Telegram). Доступность определяется в рантайме через /api/auth/telegram-config.
 *
 * ВАЖНО: в @BotFather → Bot Settings → Web Login должен быть добавлен Allowed URL
 * текущего домена, иначе Telegram не выполнит вход.
 */
export default function TelegramLoginButton({ onSuccess }: { onSuccess?: () => void; disabled?: boolean }) {
  const [config, setConfig] = useState<{ enabled: boolean; clientId: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/telegram-config')
      .then((r) => (r.ok ? r.json() : { enabled: false, clientId: null }))
      .then((c) => active && setConfig(c))
      .catch(() => active && setConfig({ enabled: false, clientId: null }));
    return () => {
      active = false;
    };
  }, []);

  const handleAuth = useCallback(
    async (data: { id_token?: string }) => {
      if (!data.id_token) return;
      const res = await signIn('telegram', { id_token: data.id_token, redirect: false });
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
  if (config === null || !config.enabled || !config.clientId) {
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

  return <TelegramWidget clientId={config.clientId} onAuth={handleAuth} onError={(m) => toast.error(m)} />;
}
