'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Send } from 'lucide-react';
import Button from '@/components/ui/Button';

type ConnState = { connected: boolean; label?: string };
type Status = { google: ConnState; telegram: ConnState };

type TelegramLogin = { auth: (o: { bot_id: string; request_access?: string }, cb: (u: Record<string, unknown> | false) => void) => void };
function getTelegramLogin(): TelegramLogin | undefined {
  return (window as unknown as { Telegram?: { Login?: TelegramLogin } }).Telegram?.Login;
}

let tgScript: Promise<void> | null = null;
function loadTgWidget(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (getTelegramLogin()) return Promise.resolve();
  if (tgScript) return tgScript;
  tgScript = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('tg widget failed'));
    document.head.appendChild(s);
  });
  return tgScript;
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C39.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function ConnectedAccounts() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/profile/connections', { credentials: 'include' });
      if (r.ok) setStatus(await r.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Результат привязки Google приходит редиректом ?link=...
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('link');
    if (!code) return;
    const map: Record<string, [string, 'success' | 'error']> = {
      google_ok: ['Google успешно привязан', 'success'],
      google_taken: ['Этот Google уже привязан к другому аккаунту', 'error'],
      google_error: ['Не удалось привязать Google', 'error'],
      google_cancelled: ['Привязка Google отменена', 'error'],
      google_unconfigured: ['Google ещё не настроен на сервере', 'error'],
    };
    const m = map[code];
    if (m) toast[m[1]](m[0]);
    window.history.replaceState({}, '', '/profile');
    load();
  }, [load]);

  const connectGoogle = () => {
    window.location.href = '/api/profile/connections/google/start';
  };

  const connectTelegram = async () => {
    setBusy('telegram');
    try {
      // bot_id берём из рантайм-конфига (как в TelegramLoginButton) — не зависит от build-time env.
      const cfg = await fetch('/api/auth/telegram-config').then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const botId: string | undefined = cfg?.botId || undefined;
      if (!cfg?.enabled || !botId) { toast.error('Telegram ещё не настроен'); setBusy(null); return; }
      await loadTgWidget();
      const tg = getTelegramLogin();
      if (!tg) { toast.error('Telegram-виджет недоступен'); setBusy(null); return; }
      tg.auth({ bot_id: botId, request_access: 'write' }, async (u) => {
        if (!u) { setBusy(null); return; }
        const r = await fetch('/api/profile/connections/telegram', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(u),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) { toast.success('Telegram привязан'); load(); } else toast.error(d.error || 'Ошибка привязки');
        setBusy(null);
      });
    } catch { toast.error('Ошибка Telegram'); setBusy(null); }
  };

  const disconnect = async (provider: 'google' | 'telegram') => {
    setBusy(provider);
    try {
      const r = await fetch(`/api/profile/connections/${provider}`, { method: 'DELETE', credentials: 'include' });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { toast.success('Аккаунт отвязан'); load(); } else toast.error(d.error || 'Не удалось отвязать');
    } catch { toast.error('Ошибка'); }
    setBusy(null);
  };

  const rows = [
    {
      key: 'google' as const,
      name: 'Google',
      glyph: <GoogleGlyph />,
      conn: status?.google,
      connect: connectGoogle,
    },
    {
      key: 'telegram' as const,
      name: 'Telegram',
      glyph: <Send size={20} className="text-[#229ED9]" />,
      conn: status?.telegram,
      connect: connectTelegram,
    },
  ];

  return (
    <div className="mt-2">
      <h3 className="mb-1 text-sm font-bold uppercase tracking-tight text-[var(--foreground)]">Подключённые аккаунты</h3>
      <p className="mb-4 text-xs text-[var(--text-secondary)]">
        Привяжите Google или Telegram для быстрого входа. Привязка не меняет ваш аватар и данные профиля.
      </p>
      <div className="space-y-3">
        {rows.map((row) => {
          const connected = row.conn?.connected;
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--fc-surface)]">
                  {row.glyph}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{row.name}</p>
                  {connected ? (
                    <p className="flex items-center gap-1 truncate text-xs text-emerald-500">
                      <Check size={12} /> {row.conn?.label || 'Подключён'}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)]">Не подключён</p>
                  )}
                </div>
              </div>
              {connected ? (
                <Button variant="outline" size="sm" loading={busy === row.key} onClick={() => disconnect(row.key)}>
                  Отвязать
                </Button>
              ) : (
                <Button variant="primary" size="sm" loading={busy === row.key} onClick={row.connect}>
                  Привязать
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
