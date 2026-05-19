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

// Magnetic button component
const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ children, className, onClick, style }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = 50;
    
    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      const moveX = x * force * 0.15;
      const moveY = y * force * 0.15;
      
      setPosition({ x: moveX, y: moveY });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
};

// Particle effect for holographic materialization
const HologramParticles: React.FC<{ isActive: boolean; color: string }> = ({ isActive, color }) => {
  const particleCount = 30;
  
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const startX = Math.random() * 100 - 50;
        const startY = Math.random() * 100 - 50;
        const endX = Math.random() * 20 - 10;
        const endY = Math.random() * 20 - 10;
        const delay = Math.random() * 0.3;
        const duration = 0.4 + Math.random() * 0.3;
        
        return (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}, transparent)`,
              left: '50%',
              top: '50%',
              '--start-x': `${startX}px`,
              '--start-y': `${startY}px`,
              '--end-x': `${endX}px`,
              '--end-y': `${endY}px`,
              animation: `materialize ${duration}s ease-out ${delay}s forwards`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export default function HolographicTabs({ tabs, activeTab, onTabChange, children }: HolographicTabsProps) {
  const [ambientColor, setAmbientColor] = useState(tabs[0]?.color || '#8B5CF6');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousContentRef = useRef<HTMLDivElement>(null);

  // Update ambient color when tab changes
  useEffect(() => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData) {
      setAmbientColor(activeTabData.color);
    }
  }, [activeTab, tabs]);

  const handleTabClick = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      onTabChange(tabId);
      setTimeout(() => setIsTransitioning(false), 600);
    }, 100);
  }, [activeTab, onTabChange]);

  // Preload adjacent tabs
  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const adjacentIndexes = [currentIndex - 1, currentIndex + 1].filter(i => i >= 0 && i < tabs.length);
    
    adjacentIndexes.forEach(index => {
      // Trigger preload logic here if needed
      console.log(`Preloading tab: ${tabs[index].id}`);
    });
  }, [activeTab, tabs]);

  return (
    <div 
      className="relative min-h-[calc(100vh-300px)]"
      style={{
        '--ambient-color': ambientColor,
        background: `linear-gradient(135deg, var(--ambient-color) 0%, #0f172a 100%)`,
        transition: 'background 0.8s ease',
      } as React.CSSProperties}
    >
      {/* Ambient glow overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 transition-all duration-800"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${ambientColor}40 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Tab Navigation - 3D Perspective */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
          <div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
            style={{ perspective: '1000px' }}
          >
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left - rect.width / 2;
                      const y = e.clientY - rect.top - rect.height / 2;
                      
                      const distance = Math.sqrt(x * x + y * y);
                      const maxDistance = 50;
                      
                      if (distance < maxDistance) {
                        const force = (maxDistance - distance) / maxDistance;
                        const moveX = x * force * 0.15;
                        const moveY = y * force * 0.15;
                        
                        e.currentTarget.style.transform = `translate(${moveX}px, ${moveY}px)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate(0, 0)';
                    }}
                    className={`
                      relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap
                      transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                      ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
                    `}
                    style={{
                      transform: isActive 
                        ? 'scale(1) translateY(0) rotateX(0deg)' 
                        : 'scale(0.95) translateY(20px) rotateX(5deg)',
                      opacity: isActive ? 1 : 0.6,
                      zIndex: isActive ? 10 : 1,
                      willChange: 'transform, opacity',
                    }}
                  >
                    {/* Active tab glow */}
                    {isActive && (
                      <>
                        <div 
                          className="absolute inset-0 rounded-xl blur-xl opacity-60"
                          style={{
                            background: `linear-gradient(135deg, ${tab.color}, ${tab.color}80)`,
                            boxShadow: `0 0 60px ${tab.color}, 0 0 120px ${tab.color}40`,
                          }}
                        />
                        <div 
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${tab.color}30, transparent)`,
                            border: `1px solid ${tab.color}60`,
                          }}
                        />
                      </>
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>

                    {/* Particles on activation */}
                    <HologramParticles isActive={isActive} color={tab.color} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area with Liquid Wave Transition */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative"
            >
              {/* SVG Wave Separator */}
              {isTransitioning && (
                <motion.svg
                  className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-20"
                  viewBox="0 0 1440 100"
                  preserveAspectRatio="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.path
                    d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,25 1440,50 L1440,100 L0,100 Z"
                    fill={ambientColor}
                    fillOpacity="0.2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </motion.svg>
              )}

              {/* Content */}
              <div 
                ref={contentRef}
                className="relative"
                style={{
                  minHeight: '700px',
                  willChange: 'transform, opacity',
                }}
              >
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Footer with Backdrop Blur */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div 
          className="backdrop-blur-2xl bg-slate-900/60 border-t border-white/10"
          style={{
            boxShadow: `0 -10px 40px ${ambientColor}20`,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-400">
              © 2024 ELEVATE. Все права защищены.
            </p>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes materialize {
          0% {
            transform: translate(var(--start-x), var(--start-y)) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) scale(1);
            opacity: 1;
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
