'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Zap } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/admin/dashboard');
  }, [status, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema), defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      const res = await signIn('credentials', { email: data.email, password: data.password, redirect: false });
      if (res?.error) { toast.error('Неверный email или пароль'); return; }
      router.push('/admin/dashboard');
    } catch { toast.error('Ошибка входа'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a14] px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Fashion Admin</h1>
          <p className="mt-1 text-sm text-white/30">Вход для персонала</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          {searchParams.get('error') === 'StaffOnly' && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
              Google-аккаунт не привязан к staff-пользователю.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/30">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <input type="email" autoComplete="email" {...register('email')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/30">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <input type="password" autoComplete="current-password" {...register('password')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30" />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Войти
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/20">
          Роли: admin · manager · support
        </p>
      </div>
    </div>
  );
}
