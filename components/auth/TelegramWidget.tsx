'use client';

import { useEffect, useRef } from 'react';

/**
 * Официальный встраиваемый виджет входа Telegram (telegram.org/js/telegram-widget.js).
 * Рендерит фирменную кнопку Telegram (в iframe) и вызывает onAuth с подписанным
 * payload пользователя при успехе.
 *
 * Почему виджет, а не Telegram.Login.auth({bot_id}): старый JS-popup
 * (oauth.telegram.org/auth?bot_id=…) Telegram пометил как DEPRECATED. Встраиваемый
 * виджет по username бота — актуальный поддерживаемый способ.
 *
 * Требования: домен должен быть привязан к боту в @BotFather через /setdomain,
 * а CSP должен разрешать script-src/frame-src telegram.org + oauth.telegram.org.
 */
let widgetSeq = 0;

export default function TelegramWidget({
  botUsername,
  onAuth,
  size = 'large',
  radius = 12,
}: {
  botUsername: string;
  onAuth: (user: Record<string, unknown>) => void;
  size?: 'large' | 'medium' | 'small';
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Стабильное имя глобального колбэка на жизнь компонента.
  const cbName = useRef<string>('');
  if (!cbName.current) cbName.current = `onTelegramAuth_${++widgetSeq}`;
  // Держим актуальный onAuth в ref, чтобы его смена не пересоздавала виджет.
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    const name = cbName.current;
    (window as unknown as Record<string, unknown>)[name] = (user: Record<string, unknown>) => {
      onAuthRef.current(user);
    };

    const el = ref.current;
    if (!el || !botUsername) return;

    el.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', String(radius));
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', `${name}(user)`);
    el.appendChild(script);

    return () => {
      try {
        delete (window as unknown as Record<string, unknown>)[name];
      } catch {
        /* ignore */
      }
      if (el) el.innerHTML = '';
    };
  }, [botUsername, size, radius]);

  return <div ref={ref} className="tg-login-widget flex min-h-[40px] items-center justify-center" />;
}
