'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, Eye, AlertTriangle, User, Search, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';

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

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isVerified: boolean;
  verifiedAt: Date | null;
}

export default function AdminVerificationRequestsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'admin' | 'manager' | 'support'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests();
    } else {
      loadUsers();
    }
  }, [activeTab]);

  const loadRequests = async () => {
    setLoading(true);
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users?scope=all&limit=100');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.users || []));
      } else {
        toast.error('Не удалось загрузить пользователей');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Ошибка при загрузке пользователей');
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

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'revoke' : 'grant';
    const confirmText = currentStatus 
      ? 'Отозвать верификацию у пользователя?'
      : 'Выдать верификацию пользователю?';

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/verification/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        loadUsers();
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Toggle verification error:', error);
      toast.error('Ошибка при изменении статуса верификации');
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter !== 'all' && req.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.userInfo.email.toLowerCase().includes(query) ||
        `${req.lastName} ${req.firstName}`.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredUsers = users.filter(user => {
    if (userStatusFilter === 'verified' && !user.isVerified) return false;
    if (userStatusFilter === 'unverified' && user.isVerified) return false;
    if (userRoleFilter !== 'all' && user.role !== userRoleFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.email.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const verifiedUsersCount = users.filter(u => u.isVerified).length;
  const unverifiedUsersCount = users.length - verifiedUsersCount;

  return (
    <AdminShell>
      <div className="space-y-6">
        <AdminPageHeader
          title="Управление верификациями"
          description="Просмотр заявок и ручное управление верификацией пользователей"
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--admin-border)]">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Заявки на верификацию
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </div>
            {activeTab === 'requests' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--admin-accent)]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'users'
                ? 'text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Пользователи
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
                {users.length}
              </span>
            </div>
            {activeTab === 'users' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--admin-accent)]"
              />
            )}
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'requests' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard title="Всего заявок" value={requests.length} icon={User} accent="blue" />
            <AdminStatCard title="На рассмотрении" value={pendingCount} icon={Clock} accent="amber" />
            <AdminStatCard title="Одобрено" value={approvedCount} icon={CheckCircle} accent="emerald" />
            <AdminStatCard title="Отклонено" value={rejectedCount} icon={XCircle} accent="rose" />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard title="Всего пользователей" value={users.length} icon={Users} accent="violet" />
            <AdminStatCard title="Верифицированы" value={verifiedUsersCount} icon={Shield} accent="emerald" />
            <AdminStatCard title="Не верифицированы" value={unverifiedUsersCount} icon={AlertTriangle} accent="amber" />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text-faint)]" />
          <input
            type="text"
            placeholder={activeTab === 'requests' ? "Поиск по email или имени..." : "Поиск пользователей..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-lg outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
          />
        </div>

        {/* Filters */}
        {activeTab === 'requests' && (
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-[var(--admin-accent)] text-white'
                    : 'bg-[var(--admin-card)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:bg-[var(--admin-card-hover)]'
                }`}
              >
                {f === 'all' && 'Все'}
                {f === 'pending' && `На рассмотрении (${pendingCount})`}
                {f === 'approved' && `Одобрено (${approvedCount})`}
                {f === 'rejected' && `Отклонено (${rejectedCount})`}
              </button>
            ))}
          </div>
        )}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: `Все (${users.length})` },
                { key: 'verified', label: `Верифицированы (${verifiedUsersCount})` },
                { key: 'unverified', label: `Не верифицированы (${unverifiedUsersCount})` },
              ] as const).map((x) => (
                <button
                  key={x.key}
                  onClick={() => setUserStatusFilter(x.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    userStatusFilter === x.key
                      ? 'bg-[var(--admin-accent)] text-white'
                      : 'bg-[var(--admin-card)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:bg-[var(--admin-card-hover)]'
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--admin-text-muted)]">Роль</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as typeof userRoleFilter)}
                className="px-3 py-2 bg-[var(--admin-bg-muted)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-lg text-sm outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
              >
                <option value="all">Все</option>
                <option value="customer">customer</option>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="support">support</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--admin-accent)]"></div>
          </div>
        ) : activeTab === 'requests' ? (
          /* Requests List */
          <div className="bg-[var(--admin-card)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="py-16 text-center">
                <Shield className="h-16 w-16 mx-auto text-[var(--admin-text-faint)] mb-4" />
                <p className="text-[var(--admin-text-muted)] text-lg">Нет заявок</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--admin-border)]">
                {filteredRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 hover:bg-[var(--admin-card-hover)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-[var(--admin-text)]">
                            {request.lastName} {request.firstName} {request.middleName}
                          </h3>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="text-sm text-[var(--admin-text-muted)] mb-2">
                          Email: {request.userInfo.email}
                        </p>
                        <p className="text-sm text-[var(--admin-text-muted)]">
                          Паспорт: {request.passportSeries} {request.passportNumber}
                        </p>
                        <p className="text-xs text-[var(--admin-text-faint)] mt-2">
                          Подано: {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="px-4 py-2 bg-[var(--admin-accent)] hover:opacity-90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
        ) : (
          /* Users List */
          <div className="bg-[var(--admin-card)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="h-16 w-16 mx-auto text-[var(--admin-text-faint)] mb-4" />
                <p className="text-[var(--admin-text-muted)] text-lg">Пользователи не найдены</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--admin-border)]">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 hover:bg-[var(--admin-card-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--admin-text)]">
                            {user.name || 'Без имени'}
                          </h3>
                          <p className="text-sm text-[var(--admin-text-muted)]">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {user.isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                                <CheckCircle className="h-3 w-3" />
                                Верифицирован
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] rounded-full text-xs">
                                <XCircle className="h-3 w-3" />
                                Не верифицирован
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleVerification(user.id, user.isVerified)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          user.isVerified
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {user.isVerified ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            Отозвать
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Выдать
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[var(--admin-bg-elevated)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[var(--admin-bg-elevated)] px-6 py-4 border-b border-[var(--admin-border)] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--admin-text)]">
                  Заявка на верификацию
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-[var(--admin-card-hover)] rounded-lg text-[var(--admin-text-muted)]"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[var(--admin-text)]">Личные данные</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">ФИО</p>
                      <p className="font-medium text-[var(--admin-text)]">{selectedRequest.lastName} {selectedRequest.firstName} {selectedRequest.middleName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">Дата рождения</p>
                      <p className="font-medium text-[var(--admin-text)]">{new Date(selectedRequest.dateOfBirth).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">Телефон</p>
                      <p className="font-medium text-[var(--admin-text)]">{selectedRequest.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">Email</p>
                      <p className="font-medium text-[var(--admin-text)]">{selectedRequest.userInfo.email}</p>
                    </div>
                  </div>
                </div>

                {/* Passport Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[var(--admin-text)]">Паспортные данные</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">Серия и номер</p>
                      <p className="font-medium text-[var(--admin-text)]">{selectedRequest.passportSeries} {selectedRequest.passportNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">Код подразделения</p>
                      <p className="font-medium text-[var(--admin-text)]">{selectedRequest.departmentCode || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-[var(--admin-text-muted)]">Кем выдан</p>
                      <p className="font-medium text-[var(--admin-text)]">{selectedRequest.issuedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--admin-text-muted)]">Дата выдачи</p>
                      <p className="font-medium text-[var(--admin-text)]">{new Date(selectedRequest.issueDate).toLocaleDateString('ru-RU')}</p>
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
                placeholder="Например: Нечеткое фото паспорта..."
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
    </AdminShell>
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
