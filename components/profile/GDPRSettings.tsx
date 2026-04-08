'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, FileText, AlertTriangle, Check, Loader } from 'lucide-react';

export default function GDPRSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'УДАЛИТЬ') return;
    
    setIsDeleting(true);
    // Simulate deletion process
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }, 2000);
  };

  const dataCategories = [
    { name: 'Личная информация', items: ['Имя', 'Email', 'Телефон', 'Адрес'], size: '2 KB' },
    { name: 'История заказов', items: ['Заказы', 'Платежи', 'Доставки'], size: '156 KB' },
    { name: 'Избранное и вишлист', items: ['Избранные товары', 'Список желаний'], size: '12 KB' },
    { name: 'Настройки и предпочтения', items: ['Уведомления', 'Размеры', 'Бренды'], size: '4 KB' },
    { name: 'История активности', items: ['Просмотры', 'Поиски', 'Клики'], size: '89 KB' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-slate-500/10 via-gray-500/10 to-zinc-500/10 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-zinc-900/20 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-200/50 dark:border-slate-700/50"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl">
          <FileText className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Управление данными (GDPR)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Экспорт и удаление ваших данных</p>
        </div>
      </div>

      {/* Data Categories */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FileText size={18} className="text-slate-500" />
          Ваши данные
        </h4>
        <div className="space-y-2">
          {dataCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-white dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{category.name}</p>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                  {category.size}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {category.items.map((item, i) => (
                  <span key={i} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-600/50 px-2 py-0.5 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Общий размер данных:</span>
            <span className="text-gray-900 dark:text-white font-semibold">263 KB</span>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <Download className="text-blue-500 flex-shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Экспорт данных</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Скачайте все ваши данные в формате JSON. Это включает личную информацию, историю заказов, избранное и настройки.
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting || exportComplete}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Подготовка данных...
                </>
              ) : exportComplete ? (
                <>
                  <Check size={18} />
                  Данные экспортированы
                </>
              ) : (
                <>
                  <Download size={18} />
                  Экспортировать мои данные
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Удаление аккаунта</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Это действие необратимо. Все ваши данные, заказы, избранное и история будут безвозвратно удалены.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Удалить мой аккаунт
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                      ⚠️ Подтвердите удаление
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-3">
                      Введите слово <span className="font-mono font-bold">УДАЛИТЬ</span> для подтверждения
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Введите УДАЛИТЬ"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 border-red-300 dark:border-red-700 rounded-lg text-center font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'УДАЛИТЬ' || isDeleting}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader className="animate-spin" size={16} />
                          Удаление...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Подтвердить удаление
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* GDPR Info */}
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          В соответствии с GDPR (General Data Protection Regulation) вы имеете право на доступ, исправление, экспорт и удаление ваших персональных данных. Для получения дополнительной информации ознакомьтесь с нашей{' '}
          <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            Политикой конфиденциальности
          </a>.
        </p>
      </div>
    </motion.div>
  );
}
