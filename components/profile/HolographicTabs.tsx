'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Heart, Ticket, CreditCard, Bell, Shield, User, FileText 
} from 'lucide-react';

interface HolographicTab {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  colorRGB: string;
}

interface HolographicTabsProps {
  tabs: HolographicTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export default function HolographicTabs({ tabs, activeTab, onTabChange, children }: HolographicTabsProps) {
  const [ambientColor, setAmbientColor] = useState(tabs[0]?.color || '#8B5CF6');

  // Update ambient color when tab changes
  useEffect(() => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData) {
      setAmbientColor(activeTabData.color);
    }
  }, [activeTab, tabs]);

  const handleTabClick = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    onTabChange(tabId);
  }, [activeTab, onTabChange]);

  return (
    <div className="relative min-h-[calc(100vh-300px)]">
      {/* Ambient glow overlay - optimized with CSS */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${ambientColor}30 0%, transparent 70%)`,
          transition: 'background 0.6s ease-out',
        }}
      />

      <div className="relative z-10">
        {/* Tab Navigation - Clean & Elegant */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap
                      transition-all duration-200 ease-out
                      ${isActive 
                        ? 'text-white shadow-lg' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {/* Active tab background - simple gradient */}
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)`,
                          boxShadow: `0 4px 12px ${tab.color}40`,
                        }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-1.5">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area - Smooth transitions */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ 
                duration: 0.25,
                ease: 'easeOut',
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>



      {/* CSS for scrollbar */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
