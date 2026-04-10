'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Achievement {
  name: string;
  description: string;
  icon: string;
  xp: number;
  coins: number;
  rarity: string;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-20 right-4 z-50 max-w-md"
        >
          <div className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-2xl p-6 shadow-2xl text-white relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
                >
                  <Trophy className="w-6 h-6" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-black">Достижение разблокировано!</h3>
                  <p className="text-white/80 text-sm">Поздравляем!</p>
                </div>
              </div>

              {/* Achievement Info */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1">{achievement.name}</h4>
                    <p className="text-white/90 text-sm">{achievement.description}</p>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold">+{achievement.xp} XP</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold">+{achievement.coins} монет</span>
                </div>
              </div>
            </div>

            {/* Sparkle Effects */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
