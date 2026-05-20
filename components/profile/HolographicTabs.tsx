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
        {/* Tab Navigation - Optimized */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap
                      transition-colors duration-300
                      ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
                    `}
                    layout
                  >
                    {/* Active tab background - simplified */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${tab.color}40, ${tab.color}20)`,
                          boxShadow: `0 0 30px ${tab.color}40`,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area - Optimized transitions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3,
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
