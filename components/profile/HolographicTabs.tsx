'use client';

import { useState, useEffect } from 'react';
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

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab) return;
    onTabChange(tabId);
  };

  return (
    <div className="relative min-h-[calc(100vh-300px)]">
      {/* Ambient glow overlay - GPU accelerated */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-15"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${ambientColor}25 0%, transparent 70%)`,
          transition: 'background 0.4s ease-out',
          willChange: 'background',
        }}
      />

      <div className="relative z-10">
        {/* Tab Navigation - Premium Dark UI */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-[#0f1115]/95 border-b border-gray-200 dark:border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {/* Sliding indicator background */}
              <div className="relative flex items-center gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === activeTab;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`
                        relative flex items-center justify-center gap-2 
                        h-11 px-5 rounded-xl font-medium text-sm whitespace-nowrap
                        transition-all duration-200 ease-out
                        transform-gpu will-change-transform active:scale-95
                        ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}
                      `}
                      style={{
                        transform: 'translate3d(0,0,0)',
                      }}
                    >
                      {/* Sliding background with layoutId for smooth animation */}
                      {isActive && (
                        <motion.div
                          layoutId="active-tab"
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${tab.color}60, ${tab.color}40)`,
                            boxShadow: `
                              inset 0 1px 1px ${tab.color}80,
                              0 0 20px ${tab.color}50,
                              0 4px 12px rgba(0, 0, 0, 0.1)
                            `,
                            border: `1px solid ${tab.color}90`,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}

                      {/* Hover effect for inactive tabs */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-200" />
                      )}

                      {/* Content with hover micro-interaction */}
                      <div className="relative z-10 flex items-center gap-2">
                        <span 
                          className="transition-transform duration-200"
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <Icon className="h-4 w-4 transition-transform duration-200 hover:-translate-y-0.5" />
                        </span>
                        <span className="transition-colors duration-200">{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
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

      {/* CSS for scrollbar hide and snap scroll */}
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
