'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2, X, Save, Eye } from 'lucide-react';

interface FocusModeProps {
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  onPreview?: () => void;
}

export default function FocusMode({ title, children, onSave, onPreview }: FocusModeProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarTimeout, setToolbarTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide toolbar after inactivity
  useEffect(() => {
    if (!isFocusMode) return;

    const handleMouseMove = () => {
      setShowToolbar(true);
      
      if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
      }
      
      const timeout = setTimeout(() => {
        setShowToolbar(false);
      }, 3000);
      
      setToolbarTimeout(timeout);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
      }
    };
  }, [isFocusMode, toolbarTimeout]);

  // Keyboard shortcut: ESC to exit focus mode
  useEffect(() => {
    if (!isFocusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocusMode(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, onSave]);

  if (!isFocusMode) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsFocusMode(true)}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Фокус-режим
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-[#0a0a14] overflow-auto animate-in fade-in duration-300">
      {/* Ambient Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Floating Toolbar */}
      <div 
        className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="border-b border-white/5 bg-[#0f0f1a]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <span className="text-[10px] text-white/30 px-2 py-1 rounded border border-white/10 bg-white/5">
                Фокус-режим
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {onPreview && (
                <button
                  onClick={onPreview}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Предпросмотр
                </button>
              )}
              
              {onSave && (
                <button
                  onClick={onSave}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                  <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-violet-400/30 bg-violet-500/20 px-1.5 py-0.5 text-[10px]">
                    ⌘S
                  </kbd>
                </button>
              )}
              
              <div className="h-6 w-px bg-white/10 mx-2" />
              
              <button
                onClick={() => setIsFocusMode(false)}
                className="rounded-lg p-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-screen pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom Help Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="border-t border-white/5 bg-[#0f0f1a]/80 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-6 px-6 py-2 text-[10px] text-white/30">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">ESC</kbd>
              выйти
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">⌘S</kbd>
              сохранить
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">⌘P</kbd>
              предпросмотр
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
