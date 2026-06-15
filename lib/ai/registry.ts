// Provider registry: the single source of truth for "which AI is active".
//
// Everything lives in the `settings` key/value table so the admin panel can add
// providers, rotate keys, and switch the active one WITHOUT a redeploy:
//   ai_chat_enabled   -> "true" | "false"  (master switch for AI replies)
//   ai_active_provider-> provider id
//   ai_providers      -> JSON array of AiProviderConfig (secrets encrypted)
//   ai_system_prompt  -> optional override appended to the built-in system prompt
//
// Secrets are encrypted at rest with lib/encryption (AES-256). If ENCRYPTION_KEY
// is not configured we fall back to storing them as-is (dev convenience) with a
// recognizable prefix so we know not to attempt decryption.

import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { encrypt, decrypt, isEncryptionConfigured, maskSensitiveData } from '@/lib/encryption';
import { GigaChatProvider } from './gigachat';
import { OpenAiProvider } from './openai';
import type { AiProvider, AiProviderConfig, AiProviderType } from './types';

export const AI_KEYS = {
  enabled: 'ai_chat_enabled',
  activeProvider: 'ai_active_provider',
  providers: 'ai_providers',
  systemPrompt: 'ai_system_prompt',
} as const;

const PLAINTEXT_PREFIX = 'plain:'; // marks an unencrypted secret (no ENCRYPTION_KEY)

export interface AiConfigState {
  enabled: boolean;
  activeProviderId: string | null;
  providers: AiProviderConfig[];
  systemPrompt: string | null;
}

// ---- secret helpers ---------------------------------------------------------

export function sealSecret(plain: string): string {
  if (!plain) return '';
  if (!isEncryptionConfigured()) return PLAINTEXT_PREFIX + plain;
  return encrypt(plain);
}

export function openSecret(stored: string): string {
  if (!stored) return '';
  if (stored.startsWith(PLAINTEXT_PREFIX)) return stored.slice(PLAINTEXT_PREFIX.length);
  try {
    return decrypt(stored);
  } catch {
    return '';
  }
}

/** Masked preview of a stored secret for the admin UI (never the real value). */
export function previewSecret(stored: string): string {
  const plain = openSecret(stored);
  if (!plain) return '';
  return maskSensitiveData(plain, 3);
}

// ---- settings I/O -----------------------------------------------------------

async function readSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.select().from(settings).where(inArray(settings.key, keys));
  const m: Record<string, string> = {};
  rows.forEach((r) => { m[r.key] = r.value; });
  return m;
}

async function writeSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

/** Load the full AI configuration state from settings. */
export async function getAiConfig(): Promise<AiConfigState> {
  const m = await readSettings(Object.values(AI_KEYS));
  let providers: AiProviderConfig[] = [];
  try {
    providers = m[AI_KEYS.providers] ? (JSON.parse(m[AI_KEYS.providers]) as AiProviderConfig[]) : [];
  } catch {
    providers = [];
  }
  return {
    enabled: m[AI_KEYS.enabled] === 'true',
    activeProviderId: m[AI_KEYS.activeProvider] || null,
    providers: Array.isArray(providers) ? providers : [],
    systemPrompt: m[AI_KEYS.systemPrompt] || null,
  };
}

export async function setAiEnabled(enabled: boolean): Promise<void> {
  await writeSetting(AI_KEYS.enabled, enabled ? 'true' : 'false');
}

export async function setActiveProvider(id: string): Promise<void> {
  await writeSetting(AI_KEYS.activeProvider, id);
}

export async function setSystemPrompt(prompt: string): Promise<void> {
  await writeSetting(AI_KEYS.systemPrompt, prompt || '');
}

export async function saveProviders(providers: AiProviderConfig[]): Promise<void> {
  await writeSetting(AI_KEYS.providers, JSON.stringify(providers));
}

// ---- provider instantiation -------------------------------------------------

/** Build a live provider client from a stored config (decrypts the secret). */
export function buildProvider(cfg: AiProviderConfig): AiProvider {
  const secret = openSecret(cfg.secret);
  if (!secret) throw new Error(`Provider "${cfg.label}" has no usable secret`);

  switch (cfg.type) {
    case 'gigachat':
      return GigaChatProvider.fromAuthKey(secret, cfg.model, cfg.scope);
    case 'openai':
      return new OpenAiProvider(secret, cfg.model);
    default:
      throw new Error(`Unknown provider type: ${cfg.type as string}`);
  }
}

/**
 * Resolve the active provider, or null if AI is disabled / nothing is configured.
 * This is what the chat route calls on every user message.
 */
export async function getActiveProvider(): Promise<AiProvider | null> {
  const cfg = await getAiConfig();
  if (!cfg.enabled) return null;

  const active = cfg.providers.find(
    (p) => p.id === cfg.activeProviderId && p.enabled,
  );
  if (!active) return null;

  try {
    return buildProvider(active);
  } catch {
    return null;
  }
}

export async function getSystemPromptOverride(): Promise<string | null> {
  const cfg = await getAiConfig();
  return cfg.systemPrompt;
}

export function isKnownProviderType(t: string): t is AiProviderType {
  return t === 'gigachat' || t === 'openai';
}
