// GigaChat (Sber) provider client.
//
// Auth flow (per Sber docs):
//   1. POST https://ngw.devices.sberbank.ru:9443/api/v2/oauth
//      Header: Authorization: Basic <AuthorizationKey>  (base64 of "ClientID:ClientSecret")
//      Header: RqUID: <uuid>,  body: scope=GIGACHAT_API_PERS
//      -> { access_token, expires_at }  (token lives ~30 min)
//   2. POST https://gigachat.devices.sberbank.ru/api/v1/chat/completions
//      Header: Authorization: Bearer <access_token>
//
// TLS note: GigaChat is served behind the Russian "Минцифры" root CA which is not
// in Node's bundled trust store, so requests fail with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
// We attach a per-request https.Agent with rejectUnauthorized:false scoped ONLY to
// the two Sber hosts — we never touch the global TLS setting. This mirrors how the
// repo already relaxes TLS for Supabase in lib/db.ts.

import https from 'https';
import crypto from 'crypto';
import { cacheGet, cacheSet } from '@/lib/redis';
import {
  type AiProvider,
  type AiMessage,
  type AiGenerateOptions,
  type AiGenerateResult,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from './types';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_BASE = 'https://gigachat.devices.sberbank.ru/api/v1';
const DEFAULT_SCOPE = 'GIGACHAT_API_PERS';

// Sber's chain isn't in Node's CA bundle — accept it for these hosts only.
const sberAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

interface TokenCacheEntry {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// In-memory fallback when Redis isn't configured (keyed by secret hash).
const memoryTokenCache = new Map<string, TokenCacheEntry>();

/** Low-level JSON request over the TLS-relaxed Sber agent with a hard timeout. */
function sberRequest(
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string; timeoutMs: number },
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: options.method,
        headers: options.headers,
        agent: sberAgent,
        timeout: options.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf-8') }),
        );
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('GigaChat request timed out'));
    });
    if (options.body) req.write(options.body);
    req.end();
  });
}

export class GigaChatProvider implements AiProvider {
  readonly type = 'gigachat' as const;
  readonly model: string;
  private readonly authKey: string;
  private readonly scope: string;
  private readonly tokenKey: string;

  /**
   * @param authKey Authorization Key = base64("ClientID:ClientSecret").
   * @param model   e.g. "GigaChat" | "GigaChat-Pro" | "GigaChat-Max".
   * @param scope   OAuth scope, defaults to GIGACHAT_API_PERS.
   */
  constructor(authKey: string, model = 'GigaChat', scope = DEFAULT_SCOPE) {
    this.authKey = authKey;
    this.model = model || 'GigaChat';
    this.scope = scope || DEFAULT_SCOPE;
    // Cache token per credential so rotating the key invalidates the cache.
    this.tokenKey = `ai:gigachat:token:${crypto.createHash('sha256').update(authKey).digest('hex').slice(0, 16)}`;
  }

  /** Build a GigaChat provider from a base64 Authorization Key. */
  static fromAuthKey(authKey: string, model?: string, scope?: string): GigaChatProvider {
    return new GigaChatProvider(authKey, model, scope);
  }

  /** Build a GigaChat provider from raw Client ID + Client Secret (base64-encoded here). */
  static fromClientCredentials(clientId: string, clientSecret: string, model?: string, scope?: string): GigaChatProvider {
    const authKey = Buffer.from(`${clientId}:${clientSecret}`, 'utf-8').toString('base64');
    return new GigaChatProvider(authKey, model, scope);
  }

  private async getAccessToken(timeoutMs: number): Promise<string> {
    const now = Date.now();
    const skew = 60_000; // refresh a minute early

    // 1) Redis cache
    const cached = await cacheGet<TokenCacheEntry>(this.tokenKey);
    if (cached && cached.expiresAt - skew > now) return cached.accessToken;

    // 2) In-memory cache
    const mem = memoryTokenCache.get(this.tokenKey);
    if (mem && mem.expiresAt - skew > now) return mem.accessToken;

    // 3) Fetch a fresh token
    const res = await sberRequest(OAUTH_URL, {
      method: 'POST',
      timeoutMs,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: crypto.randomUUID(),
        Authorization: `Basic ${this.authKey}`,
      },
      body: `scope=${encodeURIComponent(this.scope)}`,
    });

    if (res.status !== 200) {
      throw new Error(`GigaChat OAuth failed (${res.status}): ${res.body.slice(0, 300)}`);
    }

    const data = JSON.parse(res.body) as { access_token?: string; expires_at?: number };
    if (!data.access_token) throw new Error('GigaChat OAuth: no access_token in response');

    // expires_at is epoch ms; fall back to 25 min if absent.
    const expiresAt = typeof data.expires_at === 'number' ? data.expires_at : now + 25 * 60_000;
    const entry: TokenCacheEntry = { accessToken: data.access_token, expiresAt };

    memoryTokenCache.set(this.tokenKey, entry);
    const ttlSec = Math.max(60, Math.floor((expiresAt - now) / 1000) - 60);
    await cacheSet(this.tokenKey, entry, ttlSec);

    return data.access_token;
  }

  async generate(messages: AiMessage[], opts: AiGenerateOptions = {}): Promise<AiGenerateResult> {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const token = await this.getAccessToken(timeoutMs);

    const res = await sberRequest(`${API_BASE}/chat/completions`, {
      method: 'POST',
      timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
        stream: false,
      }),
    });

    if (res.status !== 200) {
      throw new Error(`GigaChat completions failed (${res.status}): ${res.body.slice(0, 300)}`);
    }

    const data = JSON.parse(res.body) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('GigaChat: empty completion');

    return { text, model: this.model };
  }

  async test(): Promise<{ ok: boolean; detail: string }> {
    try {
      const token = await this.getAccessToken(DEFAULT_TIMEOUT_MS);
      // List models as a cheap authenticated probe.
      const res = await sberRequest(`${API_BASE}/models`, {
        method: 'GET',
        timeoutMs: DEFAULT_TIMEOUT_MS,
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.status !== 200) {
        return { ok: false, detail: `Модели недоступны (${res.status}): ${res.body.slice(0, 200)}` };
      }
      const data = JSON.parse(res.body) as { data?: Array<{ id?: string }> };
      const models = (data.data || []).map((m) => m.id).filter(Boolean).join(', ');
      return { ok: true, detail: `Подключение успешно. Доступные модели: ${models || '—'}` };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  }
}
