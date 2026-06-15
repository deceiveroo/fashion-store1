// Shared types for the pluggable AI provider layer.
//
// The chat assistant is provider-agnostic: a single `AiProvider` interface is
// implemented per backend (GigaChat today; OpenAI/others later). Which provider
// is active — and its credentials/model — is stored in the `settings` table and
// editable from the admin panel, so keys can be rotated without a redeploy.

/** A single turn in the conversation passed to the model. */
export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Provider backends we know how to talk to. */
export type AiProviderType = 'gigachat' | 'openai';

/**
 * One configured provider as persisted in settings (`ai_providers` JSON array).
 * Secrets are stored encrypted (AES-256 via lib/encryption) and never sent to
 * the client in plaintext.
 */
export interface AiProviderConfig {
  id: string;
  type: AiProviderType;
  /** Human label shown in the admin UI, e.g. "GigaChat (личный)". */
  label: string;
  /** Model name, e.g. "GigaChat", "GigaChat-Pro", "gpt-4o-mini". */
  model: string;
  /** OAuth scope for GigaChat, e.g. "GIGACHAT_API_PERS". */
  scope?: string;
  /**
   * Encrypted credential blob. For GigaChat this is the Authorization Key
   * (base64 of "ClientID:ClientSecret"). For OpenAI it is the API key.
   */
  secret: string;
  enabled: boolean;
  createdAt?: string;
}

/** Options for a single generation call. */
export interface AiGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  /** Abort the request after this many ms. */
  timeoutMs?: number;
}

/** Result of a generation attempt. */
export interface AiGenerateResult {
  text: string;
  /** Provider/model that produced the answer (for logging/analytics). */
  model: string;
}

/** A ready-to-use provider client built from an `AiProviderConfig`. */
export interface AiProvider {
  readonly type: AiProviderType;
  readonly model: string;
  /** Generate a reply for the given message history. */
  generate(messages: AiMessage[], opts?: AiGenerateOptions): Promise<AiGenerateResult>;
  /** Lightweight connectivity/credentials check for the admin "Проверить" button. */
  test(): Promise<{ ok: boolean; detail: string }>;
}

export const DEFAULT_TIMEOUT_MS = 20_000;
export const DEFAULT_TEMPERATURE = 0.3;
export const DEFAULT_MAX_TOKENS = 800;
