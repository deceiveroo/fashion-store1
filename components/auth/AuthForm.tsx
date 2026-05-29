'use client';

import { useMemo, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, Check, X, KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { AuthMode } from '@/context/AuthModalContext';
import TelegramLoginButton from './TelegramLoginButton';

const EASE = [0.22, 1, 0.36, 1] as const;

const inputCls =
  'w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] py-3 pl-11 pr-11 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none backdrop-blur-md transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40';

const btnCls =
  'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60';
const btnStyle = { backgroundImage: 'linear-gradient(135deg, #8b7cf6, #c4b5fd)' };

// ─── Сила пароля ───
type PwChecks = { len: boolean; case: boolean; digit: boolean; special: boolean };
function scorePassword(pw: string): { score: number; checks: PwChecks } {
  const checks: PwChecks = {
    len: pw.length >= 8,
    case: /[a-zа-я]/.test(pw) && /[A-ZА-Я]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-zА-Яа-я0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}
const STRENGTH = [
  { label: '', color: 'transparent' },
  { label: 'Слабый', color: '#ef4444' },
  { label: 'Средний', color: '#f59e0b' },
  { label: 'Хороший', color: '#3b82f6' },
  { label: 'Надёжный', color: '#10b981' },
];

const emailValid = (e: string) => /\S+@\S+\.\S+/.test(e);

type Props = {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  context?: 'page' | 'modal';
  onSuccess?: () => void;
};

export default function AuthForm({ mode, onModeChange, context = 'page', onSuccess }: Props) {
  const router = useRouter();
  const { register } = useAuth();

  // общие
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // регистрация
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totp, setTotp] = useState('');

  // сброс пароля
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const totpRef = useRef<HTMLInputElement>(null);
  const { score, checks } = useMemo(() => scorePassword(password), [password]);

  const finishSuccess = () => {
    onSuccess?.();
    if (context === 'page') {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      router.push(params?.get('redirect') || '/');
    } else {
      router.refresh();
    }
  };

  const switchMode = (m: AuthMode) => {
    setError('');
    setNeedsTotp(false);
    setTotp('');
    onModeChange(m);
  };

  // ─── Вход (с шагом 2FA) ───
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailValid(email)) return setError('Введите корректный email');
    if (!password) return setError('Введите пароль');

    setIsLoading(true);
    try {
      // Предпроверка: валиден ли пароль и нужен ли код 2FA.
      if (!needsTotp) {
        const pre = await fetch('/api/auth/precheck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }).then((r) => r.json());

        if (!pre.valid) {
          setError('Неверный email или пароль');
          setIsLoading(false);
          return;
        }
        if (pre.twoFactorRequired) {
          setNeedsTotp(true);
          setIsLoading(false);
          setTimeout(() => totpRef.current?.focus(), 50);
          return;
        }
      } else if (totp.length !== 6) {
        setError('Введите 6-значный код из приложения');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        totpCode: needsTotp ? totp : undefined,
        redirect: false,
      });

      if (result?.error) {
        setError(needsTotp ? 'Неверный код подтверждения' : 'Не удалось войти');
        setIsLoading(false);
        return;
      }

      toast.success('С возвращением!');
      finishSuccess();
    } catch {
      setError('Ошибка подключения. Попробуйте ещё раз.');
      setIsLoading(false);
    }
  };

  // ─── Регистрация (+ авто-логин) ───
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Введите имя');
    if (!emailValid(email)) return setError('Введите корректный email');
    if (score < 2) return setError('Пароль слишком слабый');
    if (password !== confirmPassword) return setError('Пароли не совпадают');

    setIsLoading(true);
    try {
      await register({
        email,
        password,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
      });
      // Авто-логин: устанавливаем полноценную NextAuth-сессию.
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        toast.success('Аккаунт создан! Войдите, пожалуйста.');
        switchMode('signin');
        setIsLoading(false);
        return;
      }
      toast.success('Добро пожаловать в ELEVATE!');
      finishSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка регистрации';
      setError(msg.includes('exist') || msg.includes('зарегистрирован') ? 'Этот email уже зарегистрирован' : msg);
      setIsLoading(false);
    }
  };

  // ─── Сброс пароля ───
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailValid(email)) return setError('Введите корректный email');
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResetStep('code');
        toast.success('Код отправлен на почту');
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Не удалось отправить код');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) return setError('Введите 6-значный код');
    if (scorePassword(newPassword).score < 2) return setError('Новый пароль слишком слабый');
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (res.ok) {
        toast.success('Пароль изменён. Теперь войдите.');
        setPassword('');
        setResetStep('email');
        switchMode('signin');
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Неверный код');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    mode === 'signin' ? 'С возвращением' : mode === 'signup' ? 'Создать аккаунт' : 'Восстановление';
  const subtitle =
    mode === 'signin'
      ? 'Войдите, чтобы продолжить'
      : mode === 'signup'
      ? 'Присоединяйтесь к ELEVATE'
      : 'Сбросим пароль за пару шагов';

  return (
    <div className="w-full">
      {/* Заголовок */}
      <div className="mb-7">
        <motion.h1
          key={`${mode}-title`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]"
        >
          {title}
        </motion.h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>
      </div>

      {/* Ошибка */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
          >
            <X size={16} className="shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ───────── ВХОД ───────── */}
        {mode === 'signin' && (
          <motion.form
            key="signin"
            onSubmit={handleSignIn}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-4"
          >
            <Field icon={Mail}>
              <input type="email" autoComplete="email" className={inputCls} placeholder="Email"
                value={email} disabled={needsTotp} onChange={(e) => setEmail(e.target.value)} />
            </Field>

            <Field icon={Lock} trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }>
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className={inputCls}
                placeholder="Пароль" value={password} disabled={needsTotp} onChange={(e) => setPassword(e.target.value)} />
            </Field>

            {/* Шаг 2FA */}
            <AnimatePresence>
              {needsTotp && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="flex items-center gap-2 rounded-xl border border-[#8b7cf6]/30 bg-[#8b7cf6]/10 px-3 py-2 text-xs text-[#8b7cf6]">
                    <ShieldCheck size={15} /> Включена двухфакторная защита — введите код из приложения
                  </div>
                  <Field icon={KeyRound} className="mt-3">
                    <input ref={totpRef} inputMode="numeric" className={`${inputCls} tracking-[0.4em]`} placeholder="000000"
                      maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-[#8b7cf6] hover:underline">
                Забыли пароль?
              </button>
            </div>

            <button type="submit" disabled={isLoading} className={btnCls} style={btnStyle}>
              {isLoading ? 'Входим…' : needsTotp ? 'Подтвердить код' : 'Войти'}
            </button>

            <OrDivider />
            <TelegramLoginButton onSuccess={finishSuccess} disabled={isLoading} />

            <p className="pt-1 text-center text-sm text-[var(--text-secondary)]">
              Нет аккаунта?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-[#8b7cf6] hover:underline">
                Зарегистрироваться
              </button>
            </p>
          </motion.form>
        )}

        {/* ───────── РЕГИСТРАЦИЯ ───────── */}
        {mode === 'signup' && (
          <motion.form
            key="signup"
            onSubmit={handleSignUp}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-4"
          >
            <Field icon={User}>
              <input type="text" autoComplete="name" className={inputCls} placeholder="Ваше имя"
                value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field icon={Mail} valid={email ? emailValid(email) : undefined}>
              <input type="email" autoComplete="email" className={inputCls} placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field icon={Lock} trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }>
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={inputCls}
                placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>

            {/* Индикатор силы пароля */}
            <AnimatePresence>
              {password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--fc-glass-border)]">
                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                          animate={{ width: i <= score ? '100%' : 0, backgroundColor: STRENGTH[score].color }}
                          transition={{ duration: 0.3 }} />
                      </div>
                    ))}
                  </div>
                  {score > 0 && <p className="text-xs font-medium" style={{ color: STRENGTH[score].color }}>{STRENGTH[score].label} пароль</p>}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Req ok={checks.len}>8+ символов</Req>
                    <Req ok={checks.case}>Буквы разного регистра</Req>
                    <Req ok={checks.digit}>Цифра</Req>
                    <Req ok={checks.special}>Спецсимвол</Req>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Field icon={Lock} valid={confirmPassword ? confirmPassword === password : undefined}>
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={inputCls}
                placeholder="Повторите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </Field>

            <button type="submit" disabled={isLoading} className={btnCls} style={btnStyle}>
              {isLoading ? 'Создаём…' : 'Создать аккаунт'}
            </button>

            <OrDivider />
            <TelegramLoginButton onSuccess={finishSuccess} disabled={isLoading} />

            <p className="pt-1 text-center text-sm text-[var(--text-secondary)]">
              Уже есть аккаунт?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-[#8b7cf6] hover:underline">
                Войти
              </button>
            </p>
          </motion.form>
        )}

        {/* ───────── СБРОС ПАРОЛЯ ───────── */}
        {mode === 'forgot' && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {resetStep === 'email' ? (
              <form onSubmit={handleForgotEmail} className="space-y-4">
                <Field icon={Mail}>
                  <input type="email" autoComplete="email" className={inputCls} placeholder="Email"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <button type="submit" disabled={isLoading} className={btnCls} style={btnStyle}>
                  {isLoading ? 'Отправляем…' : 'Отправить код'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <Field icon={KeyRound}>
                  <input inputMode="numeric" className={`${inputCls} tracking-[0.4em]`} placeholder="Код из письма"
                    maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                </Field>
                <Field icon={Lock} trailing={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }>
                  <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={inputCls}
                    placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </Field>
                <button type="submit" disabled={isLoading} className={btnCls} style={btnStyle}>
                  {isLoading ? 'Сохраняем…' : 'Сбросить пароль'}
                </button>
                <button type="button" onClick={() => setResetStep('email')} className="w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)]">
                  Отправить код повторно
                </button>
              </form>
            )}

            <button type="button" onClick={() => { setResetStep('email'); switchMode('signin'); }}
              className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#8b7cf6]">
              <ArrowLeft size={16} /> Вернуться ко входу
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Вспомогательные компоненты ───
function Field({
  icon: Icon, children, trailing, valid, className = '',
}: {
  icon: typeof Mail;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  valid?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
      {children}
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
        {trailing ?? (valid === true ? <Check size={18} className="text-emerald-500" /> : valid === false ? <X size={18} className="text-rose-400" /> : null)}
      </div>
    </div>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
      {ok ? <Check size={13} /> : <span className="h-[13px] w-[13px] rounded-full border border-current opacity-50" />}
      {children}
    </span>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-[var(--fc-glass-border)]" />
      <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">или</span>
      <span className="h-px flex-1 bg-[var(--fc-glass-border)]" />
    </div>
  );
}
