// Admin API: test a provider's credentials (the "Проверить" button).
// Accepts either a saved provider id, or inline credentials to validate BEFORE
// saving. Returns { ok, detail }.

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/server-auth';
import { getAiConfig, buildProvider, isKnownProviderType } from '@/lib/ai/registry';
import { GigaChatProvider } from '@/lib/ai/gigachat';
import { OpenAiProvider } from '@/lib/ai/openai';
import type { AiProvider } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

interface TestBody {
  id?: string;
  type?: string;
  model?: string;
  scope?: string;
  authKey?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let body: TestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let provider: AiProvider;
  try {
    if (body.id) {
      // Test an already-saved provider.
      const cfg = await getAiConfig();
      const found = cfg.providers.find((p) => p.id === body.id);
      if (!found) return NextResponse.json({ ok: false, detail: 'Провайдер не найден' }, { status: 404 });
      provider = buildProvider(found);
    } else {
      // Test inline credentials (not yet saved).
      const type = body.type;
      if (!type || !isKnownProviderType(type)) {
        return NextResponse.json({ ok: false, detail: 'Укажите тип провайдера' }, { status: 400 });
      }
      if (type === 'gigachat') {
        let authKey = body.authKey?.trim();
        if (!authKey && body.clientId && body.clientSecret) {
          authKey = Buffer.from(`${body.clientId.trim()}:${body.clientSecret.trim()}`, 'utf-8').toString('base64');
        }
        if (!authKey) return NextResponse.json({ ok: false, detail: 'Нужен Authorization Key или Client ID + Secret' }, { status: 400 });
        provider = GigaChatProvider.fromAuthKey(authKey, body.model, body.scope);
      } else {
        if (!body.apiKey?.trim()) return NextResponse.json({ ok: false, detail: 'Нужен API-ключ' }, { status: 400 });
        provider = new OpenAiProvider(body.apiKey.trim(), body.model);
      }
    }

    const result = await provider.test();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, detail: e instanceof Error ? e.message : String(e) });
  }
}
