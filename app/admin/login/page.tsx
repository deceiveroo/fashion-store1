'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Lock, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const err = searchParams.get('error');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin/dashboard');
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/admin/dashboard',
      });
      if (res?.error) {
        toast.error('Неверный email или пароль, или нет прав staff.');
        return;
      }
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      toast.error('Ошибка входа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 to-zinc-100 px-4 dark:from-zinc-900 dark:to-violet-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Fashion Admin</h1>
          <p className="mt-1 text-sm text-zinc-500">Вход для администраторов и персонала</p>
        </div>
        {err === 'StaffOnly' && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Google-аккаунт не привязан к staff-пользователю.
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Войти
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-500">
          Роли: <strong>admin</strong>, <strong>manager</strong>, <strong>support</strong>
        </p>
        <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <a
            href="/auth/signin"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            Войти через основной аккаунт
          </a>
        </div>
      </div>
    </div>
  );
}
