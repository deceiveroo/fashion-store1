'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, User, Calendar, Phone } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface VerificationRequest {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  passportSeries: string;
  passportNumber: string;
  issuedBy: string;
  issueDate: string;
  departmentCode?: string | null;
  dateOfBirth: string;
  phoneNumber: string;
  additionalInfo?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
  reviewer?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? '/api/admin/verification-requests'
        : `/api/admin/verification-requests?status=${filter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    if (!confirm('Одобрить эту заявку? Пользователь получит статус верифицированного.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/verification-requests/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при одобрении');
      }

      toast.success('Заявка одобрена! Пользователь верифицирован.');
      loadRequests();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось одобрить заявку');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Укажите причину отказа');
      return;
    }

    try {
      const res = await fetch(`/api/admin/verification-requests/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при отклонении');
      }

      toast.success('Заявка отклонена');
      setShowRejectModal(false);
      setRejectionReason('');
      loadRequests();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось отклонить заявку');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3" />
            На рассмотрении
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3" />
            Одобрено
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3" />
            Отклонено
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Заявки на верификацию</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Управление заявками пользователей на верификацию</p>
      </div>

      <div className="space-y-6">
        {/* Фильтры */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' && 'Все'}
              {f === 'pending' && 'На рассмотрении'}
              {f === 'approved' && 'Одобренные'}
              {f === 'rejected' && 'Отклоненные'}
            </button>
          ))}
        </div>

        {/* Список заявок */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Нет заявок</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.lastName} {request.firstName} {request.middleName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {request.user?.email}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Дата рождения: {new Date(request.dateOfBirth).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{request.phoneNumber}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Паспорт: {request.passportSeries} {request.passportNumber}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-gray-600 dark:text-gray-400">
                      Выдан: {request.issuedBy}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Дата выдачи: {new Date(request.issueDate).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Заявка подана: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>

                {request.additionalInfo && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Дополнительно:</strong> {request.additionalInfo}
                    </p>
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Причина отказа:</strong> {request.rejectionReason}
                    </p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Одобрить
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно для указания причины отказа */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Отклонить заявку
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Причина отказа *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Укажите причину отказа..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
