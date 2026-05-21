'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationRequest {
  id: string;
  userId: string;
  userInfo: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  firstName: string;
  lastName: string;
  middleName: string | null;
  passportSeries: string;
  passportNumber: string;
  issuedBy: string;
  issueDate: Date;
  departmentCode: string | null;
  dateOfBirth: Date;
  phoneNumber: string;
  additionalInfo: string | null;
  passportPhotoFrontUrl: string | null;
  passportPhotoBackUrl: string | null;
  selfieWithPassportUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewerInfo: any;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
}

export default function AdminVerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/admin/verification-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        toast.error('Не удалось загрузить заявки');
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Одобрить эту заявку? Пользователь получит верификацию.')) return;

    try {
      const res = await fetch(`/api/admin/verification-requests/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Заявка одобрена!');
        loadRequests();
        setSelectedRequest(null);
      } else {
        toast.error(data.error || 'Ошибка при одобрении');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Ошибка при одобрении заявки');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast.error('Укажите причину отказа');
      return;
    }

    try {
      const res = await fetch(`/api/admin/verification-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Заявка отклонена');
        loadRequests();
        setSelectedRequest(null);
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        toast.error(data.error || 'Ошибка при отклонении');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Ошибка при отклонении заявки');
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Shield className="h-8 w-8 text-purple-600" />
          Заявки на верификацию
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Управление заявками пользователей на подтверждение личности
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего заявок</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{requests.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">На рассмотрении</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Одобрено</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{approvedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Отклонено</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{rejectedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'all' && 'Все'}
            {f === 'pending' && `На рассмотрении (${pendingCount})`}
            {f === 'approved' && `Одобрено (${approvedCount})`}
            {f === 'rejected' && `Отклонено (${rejectedCount})`}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Нет заявок</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.lastName} {request.firstName} {request.middleName}
                      </h3>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Email: {request.userInfo.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Паспорт: {request.passportSeries} {request.passportNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Подано: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Просмотреть
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Заявка на верификацию
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Личные данные</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ФИО</p>
                    <p className="font-medium">{selectedRequest.lastName} {selectedRequest.firstName} {selectedRequest.middleName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Дата рождения</p>
                    <p className="font-medium">{new Date(selectedRequest.dateOfBirth).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Телефон</p>
                    <p className="font-medium">{selectedRequest.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium">{selectedRequest.userInfo.email}</p>
                  </div>
                </div>
              </div>

              {/* Passport Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Паспортные данные</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Серия и номер</p>
                    <p className="font-medium">{selectedRequest.passportSeries} {selectedRequest.passportNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Код подразделения</p>
                    <p className="font-medium">{selectedRequest.departmentCode || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Кем выдан</p>
                    <p className="font-medium">{selectedRequest.issuedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Дата выдачи</p>
                    <p className="font-medium">{new Date(selectedRequest.issueDate).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {(selectedRequest.passportPhotoFrontUrl || selectedRequest.passportPhotoBackUrl || selectedRequest.selfieWithPassportUrl) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Документы</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedRequest.passportPhotoFrontUrl && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Разворот с фото</p>
                        <img src={selectedRequest.passportPhotoFrontUrl} alt="Passport front" className="w-full rounded-lg border" />
                      </div>
                    )}
                    {selectedRequest.passportPhotoBackUrl && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Разворот с регистрацией</p>
                        <img src={selectedRequest.passportPhotoBackUrl} alt="Passport back" className="w-full rounded-lg border" />
                      </div>
                    )}
                    {selectedRequest.selfieWithPassportUrl && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Селфи с паспортом</p>
                        <img src={selectedRequest.selfieWithPassportUrl} alt="Selfie" className="w-full rounded-lg border" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {selectedRequest.additionalInfo && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Дополнительная информация</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedRequest.additionalInfo}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.rejectionReason && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-600">Причина отказа</h3>
                  <p className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Одобрить
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold">Отклонить заявку</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Укажите причину отказа. Это сообщение будет показано пользователю.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Например: Не清晰ое фото паспорта..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Отклонить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'На рассмотрении' },
    approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Одобрено' },
    rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Отклонено' },
  };

  const { color, icon: Icon, label } = config[status as keyof typeof config];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
