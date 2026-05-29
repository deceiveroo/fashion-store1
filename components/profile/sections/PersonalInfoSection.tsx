'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Mail, Phone, MapPin, Loader, Trash2, AlertTriangle, Shield, CheckCircle, Award, X, Clock } from 'lucide-react';
import { ProfileFormData } from '@/app/profile/hooks/useProfileData';
import { handlePhoneChangeWithCursor } from '@/app/profile/utils/formatPhone';
import VerificationForm from '@/components/profile/VerificationForm';
import Button from '@/components/ui/Button';

interface PersonalInfoSectionProps {
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  loadProfile: () => Promise<void>;
  handlePhoneChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDeleteConfirm?: boolean;
  deleteConfirmText?: string;
  setDeleteConfirmText?: (text: string) => void;
  setShowDeleteConfirm?: (show: boolean) => void;
  handleDeleteAccount?: () => Promise<void>;
}

export default function PersonalInfoSection({
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  isSaving,
  handleSave,
  loadProfile,
  showDeleteConfirm,
  deleteConfirmText,
  setDeleteConfirmText,
  setShowDeleteConfirm,
  handleDeleteAccount,
}: PersonalInfoSectionProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Загружаем статус верификации
  useEffect(() => {
    const loadVerificationStatus = async () => {
      try {
        const res = await fetch('/api/user/verification');
        if (res.ok) {
          const data = await res.json();
          setIsVerified(data.isVerified || false);
          setVerifiedAt(data.verifiedAt || null);
          
          // Проверяем статус заявки
          if (data.latestRequest) {
            if (data.latestRequest.status === 'pending') {
              setRequestStatus('pending');
            } else if (data.latestRequest.status === 'rejected') {
              setRequestStatus('rejected');
              setRejectionReason(data.latestRequest.rejectionReason);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load verification status:', error);
      } finally {
        setLoadingVerification(false);
      }
    };

    loadVerificationStatus();
  }, []);
  // Handle phone change with cursor management
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePhoneChangeWithCursor(e, formData.phone, (value: string) => {
      setFormData({ ...formData, phone: value });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} icon={<Edit3 size={16} />}>
            Редактировать
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Имя</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          ) : (
            <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-900 dark:text-white">{formData.firstName || '—'}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Фамилия</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          ) : (
            <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-900 dark:text-white">{formData.lastName || '—'}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <Mail size={16} className="text-gray-500" />
            <span className="text-gray-900 dark:text-white">{formData.email}</span>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="+7 (___) ___-__-__"
            />
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Phone size={16} className="text-gray-500" />
              <span className="text-gray-900 dark:text-white">{formData.phone || 'Не указан'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Адрес</label>
        {isEditing ? (
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Город, улица, дом, квартира"
          />
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <MapPin size={16} className="text-gray-500 mt-1" />
            <span className="text-gray-900 dark:text-white">{formData.address || 'Адрес не указан'}</span>
          </div>
        )}
      </div>

      {/* Verification Status & Button */}
      {!loadingVerification && (
        <div className={`mt-6 p-4 border rounded-xl ${
          isVerified 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
            : requestStatus === 'rejected'
            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
            : requestStatus === 'pending'
            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isVerified ? (
                <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : requestStatus === 'rejected' ? (
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : requestStatus === 'pending' ? (
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              {isVerified ? (
                <>
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Вы верифицированы!
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    Спасибо, что вы с нами! Ваш аккаунт прошел полную верификацию.
                  </p>
                  {verifiedAt && (
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Дата верификации: {new Date(verifiedAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span>Все возможности платформы доступны</span>
                  </div>
                </>
              ) : requestStatus === 'rejected' ? (
                <>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Ваши данные не прошли проверку
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    К сожалению, ваша заявка на верификацию была отклонена. Пожалуйста, исправьте ошибки и подайте заявку снова.
                  </p>
                  {rejectionReason && (
                    <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-1">Причина отказа:</p>
                      <p className="text-xs text-red-600 dark:text-red-400">{rejectionReason}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Подать заявку снова
                  </button>
                </>
              ) : requestStatus === 'pending' ? (
                <>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Заявка на рассмотрении
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    Ваша заявка на верификацию принята и находится на рассмотрении. Пожалуйста, ожидайте решения администратора.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                    <Clock className="h-4 w-4" />
                    <span>Обычно рассмотрение занимает 1-2 рабочих дня</span>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Верификация аккаунта</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Подтвердите свою личность для получения синей галочки и дополнительных возможностей.
                    Ваши данные защищены и шифруются. Никто не может получить доступ к вашим паспортным данным.
                  </p>
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Пройти верификацию
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} loading={isSaving} fullWidth size="lg">
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button variant="outline" fullWidth size="lg" onClick={() => { setIsEditing(false); loadProfile(); }}>
            Отмена
          </Button>
        </div>
      )}

      {/* Delete Account Section */}
      {showDeleteConfirm !== undefined && deleteConfirmText !== undefined && setDeleteConfirmText && setShowDeleteConfirm && handleDeleteAccount && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Удаление аккаунта
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Это действие необратимо. Все данные будут удалены.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Удалить аккаунт
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  Введите <span className="font-mono font-bold">УДАЛИТЬ</span> для подтверждения
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Введите УДАЛИТЬ"
                  className="w-full px-4 py-2 border-2 border-red-300 dark:border-red-700 rounded-lg text-center font-mono"
                />
                <div className="flex gap-2">
                  <button
                    disabled={deleteConfirmText !== 'УДАЛИТЬ'}
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    Подтвердить
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Modal - Notification Style */}
      <AnimatePresence>
        {showVerificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setShowVerificationModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Gradient Background like Notifications */}
              <div className="relative px-6 py-5 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Верификация аккаунта
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                        Подтвердите личность для получения синей галочки
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <div className="p-6">
                  <VerificationForm 
                    onSuccess={() => {
                      setShowVerificationModal(false);
                      // Перезагружаем статус верификации
                      setIsVerified(true);
                      setVerifiedAt(new Date().toISOString());
                    }} 
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
