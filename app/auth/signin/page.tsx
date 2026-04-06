'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email некорректен';
    }
    
    if (!password) {
      newErrors.password = 'Пароль обязателен';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('С возвращением!');
      // Also sign in via NextAuth so admin proxy can see the session
      const { signIn } = await import('next-auth/react');
      await signIn('credentials', { email, password, redirect: false });
      router.push(callbackUrl);
    } catch (error: any) {
      console.error('Login error:', error);
      // Проверяем, является ли ошибка сетевой
      if (error.message.includes('Failed to fetch') || error.message.includes('сети') || error.message.includes('connection')) {
        toast.error('Ошибка подключения. Проверьте интернет-соединение и повторите попытку.');
      } else {
        toast.error(error.message || 'Неверные учетные данные');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign in removed - using only custom auth

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
            >
              С возвращением
            </motion.h1>
            <p className="text-gray-700">Войдите в свой аккаунт</p>
          </div>



          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email адрес
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if(errors.email) setErrors(prev => ({...prev, email: ''}));
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-white/50 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Введите ваш email"
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Пароль
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 transition-colors">
                  Забыли пароль?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if(errors.password) setErrors(prev => ({...prev, password: ''}));
                  }}
                  className={`w-full pl-10 pr-12 py-3 bg-white/50 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Введите ваш пароль"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </motion.div>

            {/* Admin Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-gray-500 bg-purple-50 rounded-lg p-3"
            >
              <strong>Доступ администратора:</strong> ХУЙ ВАМ НЕ СКАЖУ ЭТО МНЕ ДЛЯ ПРОВЕРКИ
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}