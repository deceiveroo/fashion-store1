'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function TestThemePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Тест темной темы
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Текущая тема: <span className="font-bold">{theme}</span>
          </p>
        </div>

        {/* Toggle Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            {theme === 'light' ? (
              <>
                <Moon size={20} />
                Переключить на темную
              </>
            ) : (
              <>
                <Sun size={20} />
                Переключить на светлую
              </>
            )}
          </button>
        </div>

        {/* Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Карточка 1
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Это тестовая карточка для проверки темной темы. Текст должен быть хорошо читаемым в обеих темах.
            </p>
            <button className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors">
              Кнопка
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Карточка 2
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Другой вариант фона для проверки контраста и читаемости текста.
            </p>
            <button className="px-4 py-2 bg-pink-600 dark:bg-pink-500 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors">
              Кнопка
            </button>
          </div>

          {/* Card 3 - Gradient */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 shadow-lg border border-purple-200 dark:border-purple-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Градиент
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Карточка с градиентным фоном для проверки сложных цветовых схем.
            </p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-600 dark:bg-purple-500 text-white rounded-full text-sm">
                Тег 1
              </span>
              <span className="px-3 py-1 bg-pink-600 dark:bg-pink-500 text-white rounded-full text-sm">
                Тег 2
              </span>
            </div>
          </div>

          {/* Card 4 - Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Форма
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Введите текст..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500"
              />
              <textarea
                placeholder="Комментарий..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Color Palette Test */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Цветовая палитра
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-900 rounded-lg mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Фон</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Поверхность</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-purple-600 dark:bg-purple-500 rounded-lg mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Основной</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-pink-600 dark:bg-pink-500 rounded-lg mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Акцент</p>
            </div>
          </div>
        </div>

        {/* Status Check */}
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-300 text-center">
            ✅ Если вы видите этот текст зеленым в обеих темах - темная тема работает правильно!
          </p>
        </div>
      </div>
    </div>
  );
}
