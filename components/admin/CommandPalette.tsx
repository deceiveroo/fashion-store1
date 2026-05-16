'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, ArrowRight, FileText, Package, ShoppingCart, Users, Settings, BarChart3, X, Clock, TrendingUp, Zap } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'action' | 'settings';
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'dashboard',
      title: 'Дашборд',
      subtitle: 'Перейти на главную',
      icon: BarChart3,
      category: 'navigation',
      action: () => { router.push('/admin/dashboard'); onClose(); },
      shortcut: 'G D',
    },
    {
      id: 'orders',
      title: 'Заказы',
      subtitle: 'Управление заказами',
      icon: ShoppingCart,
      category: 'navigation',
      action: () => { router.push('/admin/orders'); onClose(); },
      shortcut: 'G O',
    },
    {
      id: 'products',
      title: 'Товары',
      subtitle: 'Каталог товаров',
      icon: Package,
      category: 'navigation',
      action: () => { router.push('/admin/products'); onClose(); },
      shortcut: 'G P',
    },
    {
      id: 'customers',
      title: 'Клиенты',
      subtitle: 'База клиентов',
      icon: Users,
      category: 'navigation',
      action: () => { router.push('/admin/customers'); onClose(); },
      shortcut: 'G C',
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      subtitle: 'Статистика и отчёты',
      icon: TrendingUp,
      category: 'navigation',
      action: () => { router.push('/admin/analytics'); onClose(); },
      shortcut: 'G A',
    },
    
    // Actions
    {
      id: 'new-product',
      title: 'Новый товар',
      subtitle: 'Создать товар',
      icon: Package,
      category: 'action',
      action: () => { router.push('/admin/products/new'); onClose(); },
      shortcut: 'N P',
    },
    {
      id: 'new-order',
      title: 'Новый заказ',
      subtitle: 'Создать заказ вручную',
      icon: ShoppingCart,
      category: 'action',
      action: () => { router.push('/admin/orders'); onClose(); },
    },
    
    // Settings
    {
      id: 'settings',
      title: 'Настройки',
      subtitle: 'Конфигурация системы',
      icon: Settings,
      category: 'settings',
      action: () => { router.push('/admin/settings'); onClose(); },
      shortcut: ',',
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    action: filteredCommands.filter(c => c.category === 'action'),
    settings: filteredCommands.filter(c => c.category === 'settings'),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1a]/95 backdrop-blur-xl shadow-2xl shadow-black/50">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
            <Search className="h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Введите команду или поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/30">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-10 w-10 text-white/10" />
                <p className="text-sm text-white/30">Ничего не найдено</p>
                <p className="mt-1 text-xs text-white/20">Попробуйте другой запрос</p>
              </div>
            ) : (
              <>
                {/* Navigation Group */}
                {groupedCommands.navigation.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/20">
                      Навигация
                    </div>
                    {groupedCommands.navigation.map((cmd) => (
                      <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        isSelected={filteredCommands.indexOf(cmd) === selectedIndex}
                        onClick={() => cmd.action()}
                      />
                    ))}
                  </div>
                )}

                {/* Actions Group */}
                {groupedCommands.action.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/20">
                      Действия
                    </div>
                    {groupedCommands.action.map((cmd) => (
                      <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        isSelected={filteredCommands.indexOf(cmd) === selectedIndex}
                        onClick={() => cmd.action()}
                      />
                    ))}
                  </div>
                )}

                {/* Settings Group */}
                {groupedCommands.settings.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/20">
                      Настройки
                    </div>
                    {groupedCommands.settings.map((cmd) => (
                      <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        isSelected={filteredCommands.indexOf(cmd) === selectedIndex}
                        onClick={() => cmd.action()}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-[10px] text-white/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↑↓</kbd>
                навигация
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↵</kbd>
                выбрать
              </span>
            </div>
            <span>{filteredCommands.length} команд</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandRow({ 
  cmd, 
  isSelected, 
  onClick 
}: { 
  cmd: CommandItem; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = cmd.icon;
  
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
        isSelected
          ? 'bg-violet-500/20 text-white'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
        isSelected ? 'bg-violet-500/30' : 'bg-white/5 group-hover:bg-white/10'
      }`}>
        <Icon className={`h-4 w-4 ${isSelected ? 'text-violet-300' : 'text-white/40'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>
          {cmd.title}
        </div>
        {cmd.subtitle && (
          <div className={`text-xs truncate ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
            {cmd.subtitle}
          </div>
        )}
      </div>
      
      {cmd.shortcut && (
        <div className="flex items-center gap-1">
          {cmd.shortcut.split(' ').map((key, i) => (
            <kbd 
              key={i}
              className={`rounded border px-1.5 py-0.5 text-[10px] ${
                isSelected 
                  ? 'border-violet-500/30 bg-violet-500/20 text-violet-200' 
                  : 'border-white/10 bg-white/5 text-white/30'
              }`}
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
      
      {isSelected && (
        <ArrowRight className="h-4 w-4 text-violet-400" />
      )}
    </button>
  );
}
