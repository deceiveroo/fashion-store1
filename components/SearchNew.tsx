'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, TrendingUp, Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface SearchSuggestion {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
}

export default function SearchNew() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularSearches] = useState([
    'Платье', 'Джинсы', 'Кроссовки', 'Куртка', 'Футболка', 'Сумка'
  ]);
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
      >
        <SearchIcon size={22} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4"
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/50 overflow-hidden">
                {/* Search Input */}
                <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <SearchIcon size={24} className="text-white" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Поиск товаров, брендов, категорий..."
                      className="flex-1 text-xl outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      autoFocus
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => { setQuery(''); setSuggestions([]); }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <X size={20} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 rounded">ESC</kbd>
                    </button>
                  </div>
                </form>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {/* Loading */}
                  {isLoading && (
                    <div className="p-8 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"
                      />
                    </div>
                  )}

                  {/* Suggestions */}
                  {!isLoading && suggestions.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        <Sparkles size={16} />
                        Предложения
                      </div>
                      <div className="space-y-2">
                        {suggestions.map((item, index) => (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => router.push(`/products/${item.id}`)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
                          >
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <SearchIcon size={24} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {item.name}
                              </p>
                              {item.category && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                              )}
                            </div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {item.price.toLocaleString('ru-RU')} ₽
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {!isLoading && query.length >= 2 && suggestions.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <SearchIcon size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Ничего не найдено</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Попробуйте изменить запрос</p>
                    </div>
                  )}

                  {/* Search History */}
                  {!query && searchHistory.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between px-4 py-2 mb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          <Clock size={16} />
                          История поиска
                        </div>
                        <button
                          onClick={clearHistory}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          Очистить
                        </button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.map((item, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleSearch(item)}
                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                          >
                            <Clock size={16} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                            <span className="text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {item}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  {!query && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2 px-4 py-2 mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        <TrendingUp size={16} />
                        Популярные запросы
                      </div>
                      <div className="flex flex-wrap gap-2 px-4">
                        {popularSearches.map((item, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSearch(item)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all hover:scale-105"
                          >
                            {item}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">↵</kbd>
                        Поиск
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">ESC</kbd>
                        Закрыть
                      </span>
                    </div>
                    <span>⌘K для быстрого поиска</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
