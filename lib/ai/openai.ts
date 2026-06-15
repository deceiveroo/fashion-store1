// Minimal OpenAI-compatible provider.
//
// Implemented with plain fetch (no extra deps, no TLS quirks) so the admin
// "provider type" selector is real: you can drop in an OpenAI key and switch the
// chat over to it without code changes. Works with any OpenAI-compatible base URL.

import {
  type AiProvider,
  type AiMessage,
  type AiGenerateOptions,
  type AiGenerateResult,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from './types';

const DEFAULT_BASE = 'https://api.openai.com/v1';

export class OpenAiProvider implements AiProvider {
  readonly type = 'openai' as const;
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, model = 'gpt-4o-mini', baseUrl = DEFAULT_BASE) {
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
    this.baseUrl = (baseUrl || DEFAULT_BASE).replace(/\/$/, '');
  }

  private async call(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(init.headers || {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async generate(messages: AiMessage[], opts: AiGenerateOptions = {}): Promise<AiGenerateResult> {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const res = await this.call(
      '/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
          stream: false,
        }),
      },
      timeoutMs,
    );

    if (!res.ok) {
      throw new Error(`OpenAI completions failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('OpenAI: empty completion');
    return { text, model: this.model };
  }

  async test(): Promise<{ ok: boolean; detail: string }> {
    try {
      const res = await this.call('/models', { method: 'GET' }, DEFAULT_TIMEOUT_MS);
      if (!res.ok) {
        return { ok: false, detail: `Ключ отклонён (${res.status}): ${(await res.text()).slice(0, 200)}` };
      }
      return { ok: true, detail: 'Подключение успешно.' };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : String(e) };
    }
  }
}
