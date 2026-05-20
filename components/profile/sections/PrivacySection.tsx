'use client';

import { Download, Trash2, AlertTriangle, Loader } from 'lucide-react';

interface PrivacySectionProps {
  isExporting: boolean;
  showDeleteConfirm: boolean;
  deleteConfirmText: string;
  setDeleteConfirmText: (text: string) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleExportData: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
}

export default function PrivacySection({
  isExporting,
  showDeleteConfirm,
  deleteConfirmText,
  setDeleteConfirmText,
  setShowDeleteConfirm,
  handleExportData,
  handleDeleteAccount,
}: PrivacySectionProps) {
  return (
    <div className="space-y-4">
      {/* Export Data */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Экспорт данных (GDPR)</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Скачайте все ваши данные в формате JSON
        </p>
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader className="animate-spin" size={18} />
              Экспорт...
            </>
          ) : (
            <>
              <Download size={18} />
              Экспортировать данные
            </>
          )}
        </button>
      </div>

      {/* Delete Account */}
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
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'УДАЛИТЬ'}
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
  );
}
