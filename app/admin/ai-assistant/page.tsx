'use client';

import { useState, useEffect } from 'react';
import {
  Bot, Plus, Trash2, Save, Loader2, CheckCircle2, XCircle, Zap, Lock, KeyRound,
  Activity, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

type ProviderType = 'gigachat' | 'openai';
type SecretMode = 'authKey' | 'clientPair';

interface ProviderForm {
  id?: string;
  type: ProviderType;
  label: string;
  model: string;
  scope: string;
  enabled: boolean;
  hasSecret: boolean;
  secretPreview: string;
  // credential inputs (left blank unless the admin is changing them)
  secretMode: SecretMode;
  authKey: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  // per-card test result
  testState?: 'idle' | 'testing' | 'ok' | 'fail';
  testDetail?: string;
}

const DEFAULT_MODELS: Record<ProviderType, string> = { gigachat: 'GigaChat', openai: 'gpt-4o-mini' };

type CheckStatus = 'ok' | 'fail' | 'warn';
interface DiagCheck { id: string; label: string; status: CheckStatus; detail: string }
interface DiagResult { overall: CheckStatus; summary: string; checks: DiagCheck[] }

function blankProvider(type: ProviderType = 'gigachat'): ProviderForm {
  return {
    type,
    label: type === 'gigachat' ? 'GigaChat' : 'OpenAI',
    model: DEFAULT_MODELS[type],
    scope: 'GIGACHAT_API_PERS',
    enabled: true,
    hasSecret: false,
    secretPreview: '',
    secretMode: 'authKey',
    authKey: '',
    clientId: '',
    clientSecret: '',
    apiKey: '',
    testState: 'idle',
  };
}

const inputCls =
  'w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 px-3.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 transition-colors';
const labelCls =
  'block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider mb-1.5';

export default function AiAssistantPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [encryptionOk, setEncryptionOk] = useState(true);
  const [providers, setProviders] = useState<ProviderForm[]>([]);
  const [diag, setDiag] = useState<DiagResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  const runDiagnostics = async () => {
    setDiagLoading(true);
    setDiag(null);
    try {
      const r = await fetch('/api/admin/ai-providers/diagnostics', { credentials: 'include' });
      const d = await r.json();
      if (r.ok) setDiag(d);
      else toast.error(d.error || 'Не удалось выполнить проверку');
    } catch {
      toast.error('Ошибка сети при проверке');
    }
    setDiagLoading(false);
  };

  useEffect(() => {
    fetch('/api/admin/ai-providers', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setEnabled(Boolean(d.enabled));
        setActiveId(d.activeProviderId ?? null);
        setSystemPrompt(d.systemPrompt ?? '');
        setEncryptionOk(Boolean(d.encryptionConfigured));
        setProviders(
          (d.providers ?? []).map((p: Partial<ProviderForm>) => ({
            ...blankProvider(p.type as ProviderType),
            id: p.id,
            type: p.type as ProviderType,
            label: p.label ?? '',
            model: p.model ?? '',
            scope: p.scope ?? 'GIGACHAT_API_PERS',
            enabled: p.enabled ?? true,
            hasSecret: Boolean(p.hasSecret),
            secretPreview: p.secretPreview ?? '',
          })),
        );
      })
      .catch(() => toast.error('Не удалось загрузить настройки'))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<ProviderForm>) =>
    setProviders((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const addProvider = () => setProviders((prev) => [...prev, blankProvider()]);

  const removeProvider = (i: number) => {
    setProviders((prev) => {
      const removed = prev[i];
      const next = prev.filter((_, idx) => idx !== i);
      if (removed.id && removed.id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  // Build the credential payload for one provider (only sends what changed).
  const credPayload = (p: ProviderForm) => {
    if (p.type === 'gigachat') {
      if (p.secretMode === 'authKey' && p.authKey.trim()) return { authKey: p.authKey.trim() };
      if (p.secretMode === 'clientPair' && p.clientId.trim() && p.clientSecret.trim())
        return { clientId: p.clientId.trim(), clientSecret: p.clientSecret.trim() };
    } else if (p.type === 'openai' && p.apiKey.trim()) {
      return { apiKey: p.apiKey.trim() };
    }
    return p.hasSecret ? { secretUnchanged: true } : {};
  };

  const testProvider = async (i: number) => {
    const p = providers[i];
    update(i, { testState: 'testing', testDetail: undefined });
    try {
      const cred = credPayload(p);
      const usingSaved = 'secretUnchanged' in cred || Object.keys(cred).length === 0;
      const body = usingSaved && p.id
        ? { id: p.id }
        : { type: p.type, model: p.model, scope: p.scope, ...cred };
      const r = await fetch('/api/admin/ai-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const d = await r.json();
      update(i, { testState: d.ok ? 'ok' : 'fail', testDetail: d.detail });
    } catch {
      update(i, { testState: 'fail', testDetail: 'Ошибка сети' });
    }
  };

  const save = async () => {
    // Guard: every provider must have a usable secret.
    for (const p of providers) {
      const cred = credPayload(p);
      if (Object.keys(cred).length === 0) {
        toast.error(`Укажите ключ для «${p.label || p.type}»`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        enabled,
        activeProviderId: activeId,
        systemPrompt,
        providers: providers.map((p) => ({
          id: p.id,
          type: p.type,
          label: p.label,
          model: p.model,
          scope: p.scope,
          enabled: p.enabled,
          ...credPayload(p),
        })),
      };
      const r = await fetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        toast.success('Настройки ИИ сохранены');
        setActiveId(d.activeProviderId ?? activeId);
        // Reload to pick up generated ids + masked previews.
        const fresh = await fetch('/api/admin/ai-providers', { credentials: 'include' }).then((x) => x.json());
        setProviders(
          (fresh.providers ?? []).map((p: Partial<ProviderForm>) => ({
            ...blankProvider(p.type as ProviderType),
            id: p.id,
            type: p.type as ProviderType,
            label: p.label ?? '',
            model: p.model ?? '',
            scope: p.scope ?? 'GIGACHAT_API_PERS',
            enabled: p.enabled ?? true,
            hasSecret: Boolean(p.hasSecret),
            secretPreview: p.secretPreview ?? '',
          })),
        );
        setActiveId(fresh.activeProviderId ?? null);
      } else {
        toast.error(d.error || 'Не удалось сохранить');
      }
    } catch {
      toast.error('Ошибка');
    }
    setSaving(false);
  };

  return (
    <AdminShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--admin-text)]">
            <Bot className="h-6 w-6 text-[var(--admin-accent)]" /> ИИ-ассистент
          </h1>
          <p className="text-sm text-[var(--admin-text-muted)]">
            Подключение нейросетей к чату поддержки. Добавляйте провайдеров, переключайте активного, меняйте ключи без передеплоя.
          </p>
        </div>

        {!encryptionOk && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
            <Lock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              <b>ENCRYPTION_KEY не задан</b> — ключи будут храниться в БД без шифрования. Для боевого режима задайте переменную окружения ENCRYPTION_KEY.
            </span>
          </div>
        )}

        {/* Master switch */}
        <div className="admin-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text)]">ИИ отвечает в чате</p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Когда выключено — работает старый автоответчик по ключевым словам. Оператор-человек всегда перебивает ИИ.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? '' : 'bg-[var(--admin-border)]'}`}
              style={enabled ? { backgroundImage: 'var(--admin-accent-gradient)' } : undefined}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* System diagnostics */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text)]">Проверка системы</p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Полный тест: от настроек до живого ответа модели. Покажет, что именно не так.
                </p>
              </div>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={diagLoading}
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundImage: 'var(--admin-accent-gradient)' }}
            >
              {diagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              {diagLoading ? 'Проверяю…' : 'Проверить систему'}
            </button>
          </div>

          {diag && (
            <div className="space-y-3">
              {/* Overall banner */}
              <div
                className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-semibold ${
                  diag.overall === 'ok'
                    ? 'border-emerald-300/50 bg-emerald-50/60 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : diag.overall === 'warn'
                      ? 'border-amber-300/60 bg-amber-50/60 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'border-red-300/50 bg-red-50/60 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
                }`}
              >
                {diag.overall === 'ok' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : diag.overall === 'warn' ? (
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0" />
                )}
                {diag.summary}
              </div>

              {/* Per-check rows */}
              <ul className="space-y-2">
                {diag.checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-2.5 rounded-lg bg-[var(--admin-bg-muted)]/50 p-3">
                    {c.status === 'ok' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : c.status === 'warn' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--admin-text)]">{c.label}</p>
                      <p className="text-xs text-[var(--admin-text-muted)] break-words">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[var(--admin-text-faint)]">
                Совет: если меняли настройки — сначала нажмите «Сохранить», потом «Проверить систему».
              </p>
            </div>
          )}
        </div>

        {/* Providers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Провайдеры</h2>
            <button
              onClick={addProvider}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors"
            >
              <Plus className="h-4 w-4" /> Добавить
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--admin-bg-muted)]" />)}</div>
          ) : providers.length === 0 ? (
            <div className="admin-card p-8 text-center text-sm text-[var(--admin-text-muted)]">
              Пока нет провайдеров. Нажмите «Добавить» и введите ключи GigaChat.
            </div>
          ) : (
            providers.map((p, i) => (
              <div key={p.id ?? `new-${i}`} className="admin-card p-5 space-y-4">
                {/* Header row: active radio + type + enabled + delete */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--admin-text)] cursor-pointer">
                    <input
                      type="radio"
                      name="active-provider"
                      checked={Boolean(p.id) && activeId === p.id}
                      disabled={!p.id}
                      onChange={() => p.id && setActiveId(p.id)}
                      className="accent-[var(--admin-accent)]"
                    />
                    {activeId === p.id && p.id ? 'Активный' : 'Сделать активным'}
                  </label>
                  {!p.id && <span className="text-xs text-[var(--admin-text-faint)]">(сохраните, чтобы выбрать активным)</span>}

                  <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)] cursor-pointer">
                      <input type="checkbox" checked={p.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} className="accent-[var(--admin-accent)]" />
                      Включён
                    </label>
                    <button onClick={() => removeProvider(i)} className="text-[var(--admin-text-faint)] hover:text-red-500 transition-colors" title="Удалить">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Тип</label>
                    <select
                      value={p.type}
                      onChange={(e) => {
                        const type = e.target.value as ProviderType;
                        update(i, { type, model: DEFAULT_MODELS[type] });
                      }}
                      className={inputCls}
                    >
                      <option value="gigachat">GigaChat (Сбер)</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Название</label>
                    <input value={p.label} onChange={(e) => update(i, { label: e.target.value })} className={inputCls} placeholder="GigaChat (личный)" />
                  </div>
                  <div>
                    <label className={labelCls}>Модель</label>
                    <input value={p.model} onChange={(e) => update(i, { model: e.target.value })} className={inputCls} placeholder={DEFAULT_MODELS[p.type]} />
                  </div>
                  {p.type === 'gigachat' && (
                    <div>
                      <label className={labelCls}>Scope</label>
                      <input value={p.scope} onChange={(e) => update(i, { scope: e.target.value })} className={inputCls} placeholder="GIGACHAT_API_PERS" />
                    </div>
                  )}
                </div>

                {/* Credentials */}
                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)]/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
                    <KeyRound className="h-3.5 w-3.5" /> Ключи доступа
                    {p.hasSecret && <span className="ml-1 font-normal normal-case text-[var(--admin-text-faint)]">сохранён: {p.secretPreview || '••••'}</span>}
                  </div>

                  {p.type === 'gigachat' ? (
                    <>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => update(i, { secretMode: 'authKey' })}
                          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${p.secretMode === 'authKey' ? 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]' : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'}`}
                        >
                          Authorization Key
                        </button>
                        <button
                          onClick={() => update(i, { secretMode: 'clientPair' })}
                          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${p.secretMode === 'clientPair' ? 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]' : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)]'}`}
                        >
                          Client ID + Secret
                        </button>
                      </div>
                      {p.secretMode === 'authKey' ? (
                        <div>
                          <label className={labelCls}>Authorization Key (base64)</label>
                          <input value={p.authKey} onChange={(e) => update(i, { authKey: e.target.value })} className={inputCls} placeholder={p.hasSecret ? 'Оставьте пустым, чтобы не менять' : 'Вставьте Authorization Key'} autoComplete="off" />
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Client ID</label>
                            <input value={p.clientId} onChange={(e) => update(i, { clientId: e.target.value })} className={inputCls} placeholder="019ecc94-..." autoComplete="off" />
                          </div>
                          <div>
                            <label className={labelCls}>Client Secret</label>
                            <input value={p.clientSecret} onChange={(e) => update(i, { clientSecret: e.target.value })} className={inputCls} placeholder={p.hasSecret ? 'Оставьте пустым, чтобы не менять' : 'Client Secret'} autoComplete="off" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className={labelCls}>API Key</label>
                      <input value={p.apiKey} onChange={(e) => update(i, { apiKey: e.target.value })} className={inputCls} placeholder={p.hasSecret ? 'Оставьте пустым, чтобы не менять' : 'sk-...'} autoComplete="off" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => testProvider(i)}
                      disabled={p.testState === 'testing'}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-colors disabled:opacity-50"
                    >
                      {p.testState === 'testing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                      Проверить
                    </button>
                    {p.testState === 'ok' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> {p.testDetail}</span>
                    )}
                    {p.testState === 'fail' && (
                      <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3.5 w-3.5" /> {p.testDetail}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* System prompt */}
        <div className="admin-card p-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Дополнительные инструкции</h2>
            <p className="text-sm text-[var(--admin-text-muted)]">
              Необязательно. Добавляется к системному промпту (тон общения, акценты, особые правила). База знаний из FAQ подключается автоматически.
            </p>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="Например: Всегда предлагай оформить подписку на рассылку. Обращайся на «вы»."
          />
        </div>

        <button
          onClick={save}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundImage: 'var(--admin-accent-gradient)' }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </AdminShell>
  );
}
