'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import VerificationForm from '@/components/profile/VerificationForm';
import VerifiedBadge from '@/components/VerifiedBadge';
import { CheckCircle, Clock, XCircle, Loader2, Shield, FileText } from 'lucide-react';

interface VerificationStatus {
  isVerified: boolean;
  verifiedAt: string | null;
  hasPendingRequest: boolean;
  latestRequest: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    rejectionReason: string | null;
  } | null;
}

export default function VerificationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/profile/verification');
      return;
    }

    if (user) {
      loadVerificationStatus();
    }
  }, [user, authLoading]);

  const loadVerificationStatus = async () => {
    try {
      const res = await fetch('/api/user/verification');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Верификация аккаунта
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Подтвердите свою личность для получения дополнительных возможностей
        </p>
      </div>

      {/* Status Card */}
      {status?.isVerified ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                  Аккаунт верифицирован
                </h2>
                <VerifiedBadge size="lg" />
              </div>
              <p className="text-green-800 dark:text-green-200 mb-4">
                Ваш аккаунт успешно прошел верификацию. Теперь вам доступны все возможности платформы.
              </p>
              {status.verifiedAt && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Дата верификации: {new Date(status.verifiedAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : status?.hasPendingRequest ? (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                Заявка на рассмотрении
              </h2>
              <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                Ваша заявка на верификацию находится на проверке. Мы уведомим вас о результате в ближайшее время.
              </p>
              {status.latestRequest && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Дата подачи: {new Date(status.latestRequest.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : status?.latestRequest?.status === 'rejected' ? (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
                Заявка отклонена
              </h2>
              <p className="text-red-800 dark:text-red-200 mb-4">
                К сожалению, ваша заявка на верификацию была отклонена.
              </p>
              {status.latestRequest.rejectionReason && (
                <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                    Причина отказа:
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {status.latestRequest.rejectionReason}
                  </p>
                </div>
              )}
              <p className="text-sm text-red-700 dark:text-red-300">
                Вы можете подать новую заявку, исправив указанные ошибки.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Benefits Section */}
      {!status?.isVerified && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Преимущества верификации
          </h3>
          <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Повышенное доверие других пользователей</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Приоритетная поддержка</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Доступ к эксклюзивным функциям</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Увеличенные лимиты операций</span>
            </li>
          </ul>
        </div>
      )}

      {/* Verification Form */}
      {!status?.isVerified && !status?.hasPendingRequest && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
          <VerificationForm onSuccess={loadVerificationStatus} />
        </div>
      )}
    </div>
  );
}
