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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap
                      transition-all duration-300 ease-out
                      ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                    `}
                    layout
                  >
                    {/* Active tab background with glow */}
                    {isActive && (
                      <>
                        {/* Glow effect */}
                        <div
                          className="absolute inset-0 rounded-xl blur-lg opacity-60"
                          style={{
                            background: `linear-gradient(135deg, ${tab.color}, ${tab.color}80)`,
                            boxShadow: `0 0 40px ${tab.color}60`,
                          }}
                        />
                        {/* Glass background */}
                        <motion.div
                          layoutId="activeTabBackground"
                          className="absolute inset-0 rounded-xl backdrop-blur-xl"
                          style={{
                            background: `linear-gradient(135deg, ${tab.color}40, ${tab.color}20)`,
                            border: `1px solid ${tab.color}60`,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </>
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      <span>{tab.label}</span>
                    </div>

                    {/* Subtle indicator dot for active */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: tab.color }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
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
