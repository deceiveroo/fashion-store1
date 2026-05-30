'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, TrendingUp, Clock, Sparkles, ArrowRight } from 'lucide-react';
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [popularSearches] = useState([
    'Платье', 'Джинсы', 'Кроссовки', 'Куртка', 'Футболка', 'Сумка'
  ]);
  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, fetchSuggestions]);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
  }, [searchHistory, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      router.push(`/products/${suggestions[selectedIndex].id}`);
      setIsOpen(false);
    } else {
      handleSearch(query);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        aria-label="Поиск"
        className="relative p-2.5 text-[var(--text-secondary)] hover:text-[var(--fc-accent)] transition-colors rounded-xl hover:bg-[var(--fc-surface-elevated)]"
      >
        <SearchIcon size={22} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[98]"
            />

            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[99] w-full max-w-3xl px-4"
            >
              <div className="fc-glass-card overflow-hidden !rounded-3xl border border-[var(--fc-glass-border)] shadow-[var(--fc-shadow-lifted)]">
                {/* Search Input */}
                <form onSubmit={handleSubmit} className="p-6 border-b border-[var(--fc-glass-border)]">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SearchIcon size={24} className="text-white" />
                    </motion.div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedIndex(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Поиск товаров, брендов, категорий..."
                      className="flex-1 text-xl outline-none bg-transparent text-[var(--foreground)] placeholder-[var(--text-secondary)]"
                    />
                    {query && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setSuggestions([]);
                          setSelectedIndex(-1);
                          inputRef.current?.focus();
                        }}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--fc-surface-elevated)]"
                      >
                        <X size={20} />
                      </motion.button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--fc-surface-elevated)]"
                    >
                      <kbd className="px-2 py-1 text-xs font-semibold bg-[var(--fc-surface-elevated)] rounded border border-[var(--fc-glass-border)]">ESC</kbd>
                    </button>
                  </div>
                </form>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {/* Loading */}
                  {isLoading && (
                    <div className="p-8 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-2 border-[var(--fc-accent)] border-t-transparent rounded-full mx-auto"
                      />
                      <p className="text-sm text-[var(--text-secondary)] mt-3">Поиск...</p>
                    </div>
                  )}

                  {/* Suggestions */}
                  {!isLoading && suggestions.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
                        <Sparkles size={16} className="text-[var(--fc-accent)]" />
                        Найдено {suggestions.length} {suggestions.length === 1 ? 'товар' : 'товаров'}
                      </div>
                      <div className="space-y-2">
                        {suggestions.map((item, index) => (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              router.push(`/products/${item.id}`);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                              selectedIndex === index
                                ? 'bg-[rgba(var(--fc-accent-rgb)/0.14)] ring-2 ring-[var(--fc-accent)]'
                                : 'hover:bg-[var(--fc-surface-elevated)]'
                            }`}
                          >
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[var(--fc-surface)] flex-shrink-0 ring-1 ring-[var(--fc-glass-border)]">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                  <SearchIcon size={24} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--fc-accent)] transition-colors line-clamp-1">
                                {item.name}
                              </p>
                              {item.category && (
                                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{item.category}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-[var(--fc-accent)]">
                                {item.price.toLocaleString('ru-RU')} ₽
                              </div>
                              <ArrowRight size={18} className="text-[var(--text-secondary)] group-hover:text-[var(--fc-accent)] transition-colors" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {!isLoading && query.length >= 2 && suggestions.length === 0 && (
                    <div className="p-8 text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-[var(--fc-surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-[var(--fc-glass-border)]"
                      >
                        <SearchIcon size={36} className="text-[var(--text-secondary)]" />
                      </motion.div>
                      <p className="text-[var(--foreground)] font-semibold mb-2">Ничего не найдено</p>
                      <p className="text-sm text-[var(--text-secondary)]">Попробуйте изменить запрос или воспользуйтесь популярными категориями</p>
                    </div>
                  )}

                  {/* Search History */}
                  {!query && searchHistory.length > 0 && (
                    <div className="p-4 border-t border-[var(--fc-glass-border)]">
                      <div className="flex items-center justify-between px-4 py-2 mb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                          <Clock size={16} className="text-[var(--fc-accent)]" />
                          История поиска
                        </div>
                        <button
                          onClick={clearHistory}
                          className="text-xs text-[var(--text-secondary)] hover:text-[var(--fc-accent)] transition-colors font-medium"
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
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[var(--fc-surface-elevated)] transition-colors text-left group"
                          >
                            <Clock size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--fc-accent)] transition-colors" />
                            <span className="text-[var(--foreground)] group-hover:text-[var(--fc-accent)] transition-colors flex-1">
                              {item}
                            </span>
                            <ArrowRight size={16} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-all" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  {!query && (
                    <div className="p-4 border-t border-[var(--fc-glass-border)]">
                      <div className="flex items-center gap-2 px-4 py-2 mb-3 text-sm font-semibold text-[var(--text-secondary)]">
                        <TrendingUp size={16} className="text-[var(--fc-accent)]" />
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
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-[var(--fc-accent)] rounded-full text-sm font-medium hover:from-violet-500/20 hover:to-purple-500/20 transition-all border border-[var(--fc-glass-border)] hover:border-[var(--fc-accent)]"
                          >
                            {item}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)]">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 bg-[var(--fc-surface)] rounded border border-[var(--fc-glass-border)] font-mono">↵</kbd>
                        Поиск
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 bg-[var(--fc-surface)] rounded border border-[var(--fc-glass-border)] font-mono">↑↓</kbd>
                        Навигация
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="px-2 py-1 bg-[var(--fc-surface)] rounded border border-[var(--fc-glass-border)] font-mono">ESC</kbd>
                        Закрыть
                      </span>
                    </div>
                    <span className="hidden sm:block">
                      <kbd className="px-2 py-1 bg-[var(--fc-surface)] rounded border border-[var(--fc-glass-border)] font-mono">⌘K</kbd>
                      {' '}быстрый поиск
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #a855f7);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #9333ea);
        }
      `}</style>
    </>
  );
}
