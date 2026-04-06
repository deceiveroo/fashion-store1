'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Move to password step (in production this would send an email)
    setStep('password');
    toast.info('Введите новый пароль');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Пароль успешно изменён');
        setTimeout(() => window.location.href = '/auth/signin', 1500);
      } else {
        toast.error(data.message || 'Ошибка при сбросе пароля');
      }
    } catch {
      toast.error('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/auth/signin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Назад к входу
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Сброс пароля</h1>
        <p className="text-gray-500 text-sm mb-6">
          {step === 'email' ? 'Введите email вашего аккаунта' : 'Введите новый пароль'}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <button type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
              Продолжить
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Минимум 6 символов"
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Повторите пароль"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">
              {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
