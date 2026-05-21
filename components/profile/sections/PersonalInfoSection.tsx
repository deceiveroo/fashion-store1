'use client';

import { motion } from 'framer-motion';
import { Edit3, Mail, Phone, MapPin, Loader, Trash2, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { ProfileFormData } from '@/app/profile/hooks/useProfileData';
import { handlePhoneChangeWithCursor } from '@/app/profile/utils/formatPhone';

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
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Edit3 size={16} />
            Редактировать
          </button>
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
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Верификация аккаунта</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Подтвердите свою личность для получения синей галочки и дополнительных возможностей.
              Ваши данные защищены и шифруются. Никто не может получить доступ к вашим паспортным данным.
            </p>
            <a
              href="/profile/verification"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Пройти верификацию
            </a>
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader className="animate-spin" size={18} />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </button>
          <button
            onClick={() => { setIsEditing(false); loadProfile(); }}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Отмена
          </button>
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
    </div>
  );
}
