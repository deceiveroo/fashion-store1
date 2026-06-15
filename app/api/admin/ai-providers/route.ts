// Admin API: manage AI providers + which one is active.
// GET  -> current config with secrets masked.
// PUT  -> replace config (providers, active id, master switch, system prompt).
//
// Auth: admin only. Secrets are sealed (encrypted) before persisting and are
// never returned in plaintext.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { isAdmin } from '@/lib/server-auth';
import { isEncryptionConfigured } from '@/lib/encryption';
import {
  getAiConfig,
  saveProviders,
  setAiEnabled,
  setActiveProvider,
  setSystemPrompt,
  sealSecret,
  previewSecret,
  isKnownProviderType,
} from '@/lib/ai/registry';
import type { AiProviderConfig } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

// Shape of a provider as submitted by the admin UI.
interface ProviderInput {
  id?: string;
  type?: string;
  label?: string;
  model?: string;
  scope?: string;
  enabled?: boolean;
  // Credential inputs (one of):
  authKey?: string;        // GigaChat: base64 Authorization Key
  clientId?: string;       // GigaChat: raw client id
  clientSecret?: string;   // GigaChat: raw client secret
  apiKey?: string;         // OpenAI: API key
  secretUnchanged?: boolean; // keep the stored secret
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const cfg = await getAiConfig();
  return NextResponse.json({
    enabled: cfg.enabled,
    activeProviderId: cfg.activeProviderId,
    systemPrompt: cfg.systemPrompt ?? '',
    encryptionConfigured: isEncryptionConfigured(),
    providers: cfg.providers.map((p) => ({
      id: p.id,
      type: p.type,
      label: p.label,
      model: p.model,
      scope: p.scope ?? '',
      enabled: p.enabled,
      hasSecret: Boolean(p.secret),
      secretPreview: previewSecret(p.secret),
      createdAt: p.createdAt ?? null,
    })),
  });
}

/** Derive the new plaintext secret for a provider, or null if unresolved. */
function resolvePlainSecret(input: ProviderInput, existing?: AiProviderConfig): string | null {
  if (input.secretUnchanged && existing?.secret) return null; // signal: keep existing sealed value

  if (input.type === 'gigachat') {
    if (input.authKey && input.authKey.trim()) return input.authKey.trim();
    if (input.clientId && input.clientSecret) {
      return Buffer.from(`${input.clientId.trim()}:${input.clientSecret.trim()}`, 'utf-8').toString('base64');
    }
  } else if (input.type === 'openai') {
    if (input.apiKey && input.apiKey.trim()) return input.apiKey.trim();
  }
  return null;
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  let body: { enabled?: boolean; activeProviderId?: string | null; systemPrompt?: string; providers?: ProviderInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const current = await getAiConfig();
  const existingById = new Map(current.providers.map((p) => [p.id, p]));

  const inputs = Array.isArray(body.providers) ? body.providers : [];
  const next: AiProviderConfig[] = [];

  for (const input of inputs) {
    const type = input.type;
    if (!type || !isKnownProviderType(type)) {
      return NextResponse.json({ error: `Неизвестный тип провайдера: ${type}` }, { status: 400 });
    }
    const id = input.id || crypto.randomUUID();
    const existing = existingById.get(id);

    // Resolve the secret: new value (sealed) or keep the existing sealed one.
    const plain = resolvePlainSecret(input, existing);
    let sealed: string;
    if (plain) {
      sealed = sealSecret(plain);
    } else if (existing?.secret) {
      sealed = existing.secret;
    } else {
      return NextResponse.json(
        { error: `Не указан ключ для провайдера «${input.label || type}»` },
        { status: 400 },
      );
    }

    next.push({
      id,
      type,
      label: (input.label || '').trim() || (type === 'gigachat' ? 'GigaChat' : 'OpenAI'),
      model: (input.model || '').trim() || (type === 'gigachat' ? 'GigaChat' : 'gpt-4o-mini'),
      scope: type === 'gigachat' ? (input.scope || '').trim() || 'GIGACHAT_API_PERS' : undefined,
      secret: sealed,
      enabled: input.enabled !== false,
      createdAt: existing?.createdAt || new Date().toISOString(),
    });
  }

  // Validate active provider id against the saved set.
  let activeId = body.activeProviderId ?? current.activeProviderId;
  if (activeId && !next.some((p) => p.id === activeId)) activeId = null;
  if (!activeId) {
    const firstEnabled = next.find((p) => p.enabled);
    activeId = firstEnabled?.id ?? null;
  }

  await saveProviders(next);
  if (activeId) await setActiveProvider(activeId);
  if (typeof body.enabled === 'boolean') await setAiEnabled(body.enabled);
  if (typeof body.systemPrompt === 'string') await setSystemPrompt(body.systemPrompt);

  return NextResponse.json({ success: true, activeProviderId: activeId });
}
