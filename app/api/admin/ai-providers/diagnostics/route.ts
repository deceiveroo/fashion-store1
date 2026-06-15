// Admin API: end-to-end health check for the chat AI ("Проверить систему" button).
// Walks the whole chain a real user message goes through and reports each step as
// pass/fail with a human-readable hint, so the admin can see exactly what's wrong.

import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/server-auth';
import { isEncryptionConfigured } from '@/lib/encryption';
import { getAiConfig, buildProvider } from '@/lib/ai/registry';
import type { AiProvider } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

type CheckStatus = 'ok' | 'fail' | 'warn';
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const checks: Check[] = [];
  const cfg = await getAiConfig();

  // 1) Master switch
  checks.push({
    id: 'enabled',
    label: 'ИИ включён в чате',
    status: cfg.enabled ? 'ok' : 'fail',
    detail: cfg.enabled
      ? 'Тумблер «ИИ отвечает в чате» включён.'
      : 'Тумблер «ИИ отвечает в чате» выключен — сейчас отвечает старый автоответчик.',
  });

  // 2) Provider exists
  const hasProviders = cfg.providers.length > 0;
  checks.push({
    id: 'providers',
    label: 'Добавлен провайдер',
    status: hasProviders ? 'ok' : 'fail',
    detail: hasProviders
      ? `Провайдеров настроено: ${cfg.providers.length}.`
      : 'Нет ни одного провайдера. Нажмите «Добавить» и введите ключ GigaChat.',
  });

  // 3) Active provider selected & enabled
  const active = cfg.providers.find((p) => p.id === cfg.activeProviderId && p.enabled);
  checks.push({
    id: 'active',
    label: 'Выбран активный провайдер',
    status: active ? 'ok' : 'fail',
    detail: active
      ? `Активный: «${active.label}» (модель ${active.model}).`
      : cfg.activeProviderId
        ? 'Активный провайдер выбран, но выключен. Включите его галочкой «Включён».'
        : 'Не отмечен активный провайдер (точка «Сделать активным»).',
  });

  // 4) Encryption configured (warn, not fail — works without it but insecure)
  const encOk = isEncryptionConfigured();
  checks.push({
    id: 'encryption',
    label: 'Шифрование ключей',
    status: encOk ? 'ok' : 'warn',
    detail: encOk
      ? 'ENCRYPTION_KEY задан — ключи в БД зашифрованы.'
      : 'ENCRYPTION_KEY не задан — ключи хранятся без шифрования. Добавьте переменную в Vercel.',
  });

  // 5) Has a usable secret
  let provider: AiProvider | null = null;
  if (active) {
    try {
      provider = buildProvider(active);
      checks.push({
        id: 'secret',
        label: 'Ключ доступа читается',
        status: 'ok',
        detail: 'Ключ успешно расшифрован и принят.',
      });
    } catch (e) {
      checks.push({
        id: 'secret',
        label: 'Ключ доступа читается',
        status: 'fail',
        detail: `Не удалось прочитать ключ: ${e instanceof Error ? e.message : String(e)}. Введите ключ заново.`,
      });
    }
  }

  // 6) Live connectivity (OAuth + models list)
  if (provider) {
    try {
      const t = await provider.test();
      checks.push({
        id: 'connection',
        label: 'Связь с ИИ (авторизация)',
        status: t.ok ? 'ok' : 'fail',
        detail: t.detail,
      });
    } catch (e) {
      checks.push({
        id: 'connection',
        label: 'Связь с ИИ (авторизация)',
        status: 'fail',
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // 7) Live generation — actually ask the model something.
  const connOk = checks.find((c) => c.id === 'connection')?.status === 'ok';
  if (provider && connOk) {
    try {
      const res = await provider.generate(
        [
          { role: 'system', content: 'Ты — тестовый ассистент. Ответь ровно одним словом.' },
          { role: 'user', content: 'Ответь словом: работает' },
        ],
        { maxTokens: 16, temperature: 0 },
      );
      const got = (res.text || '').trim();
      checks.push({
        id: 'generation',
        label: 'ИИ генерирует ответ',
        status: got ? 'ok' : 'fail',
        detail: got ? `Модель ответила: «${got.slice(0, 80)}».` : 'Модель вернула пустой ответ.',
      });
    } catch (e) {
      checks.push({
        id: 'generation',
        label: 'ИИ генерирует ответ',
        status: 'fail',
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const hasFail = checks.some((c) => c.status === 'fail');
  const hasWarn = checks.some((c) => c.status === 'warn');
  const overall: CheckStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'ok';

  return NextResponse.json({
    overall,
    summary:
      overall === 'ok'
        ? 'Работает идеально — ИИ подключён и отвечает в чате.'
        : overall === 'warn'
          ? 'Работает, но есть предупреждение (см. ниже).'
          : 'Не работает — есть проблемы, отмеченные красным.',
    checks,
  });
}
