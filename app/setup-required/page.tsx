'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SetupRequiredPage() {
  const [copied, setCopied] = useState(false);

  const sqlMigration = `-- Создание таблицы профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  avatar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Создание таблицы избранных товаров
CREATE TABLE IF NOT EXISTS user_wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_wishlist_items_user_product_unique ON user_wishlist_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_user_idx ON user_wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS user_wishlist_items_product_idx ON user_wishlist_items(product_id);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlMigration);
    setCopied(true);
    toast.success('SQL скопирован в буфер обмена!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-purple-950 dark:to-pink-950 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6">
            <Database size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Требуется настройка базы данных
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Для работы профиля и избранного необходимо выполнить SQL миграцию
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Почему это нужно?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                В базе данных отсутствуют таблицы <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">user_profiles</code> и{' '}
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">user_wishlist_items</code>.
                Без них не будут работать профиль пользователя и избранное.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Шаги для выполнения миграции:
              </h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Откройте Supabase SQL Editor</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Перейдите на{' '}
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        supabase.com/dashboard
                      </a>{' '}
                      → выберите ваш проект → SQL Editor
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Скопируйте SQL код</p>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm">
                        <code>{sqlMigration}</code>
                      </pre>
                      <button
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-sm text-green-400">Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={16} className="text-gray-300" />
                            <span className="text-sm text-gray-300">Копировать</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Выполните SQL</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Вставьте код в SQL Editor и нажмите <strong>RUN</strong> (или Ctrl+Enter)
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    4
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Перезапустите приложение</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      В терминале: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+C</code> затем{' '}
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">npm run dev</code>
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                После выполнения миграции:
              </h3>
              <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                <li>✅ Профиль пользователя будет работать</li>
                <li>✅ Избранное будет работать</li>
                <li>✅ Ошибки подключения исчезнут</li>
                <li>✅ Не нужно будет обновлять страницы (F5)</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
          >
            ← Вернуться на главную
          </a>
        </div>
      </div>
    </div>
  );
}
