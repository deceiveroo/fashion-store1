'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface UserLevel {
  level: number;
  xp: number;
  xp_to_next_level: number;
  title: string;
  coins: number;
}

export default function GamificationWidget() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLevel();
  }, []);

  const fetchUserLevel = async () => {
    try {
      const res = await fetch('/api/gamification/profile');
      const data = await res.json();
      setUserLevel(data);
    } catch (error) {
      console.error('Error fetching user level:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userLevel) return null;

  const xpProgress = (userLevel.xp / userLevel.xp_to_next_level) * 100;

  return (
    <Link href="/gamification">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl p-4 shadow-xl cursor-pointer relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '15px 15px'
          }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"
              >
                <Trophy className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <p className="text-white/80 text-xs font-medium">Уровень {userLevel.level}</p>
                <p className="text-white text-sm font-bold">{userLevel.title}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </div>

          {/* XP Progress */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Опыт</span>
              <span className="font-bold">{userLevel.xp} / {userLevel.xp_to_next_level}</span>
            </div>
            <div className="relative h-2 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-white rounded-full"
              />
            </div>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white font-bold text-sm">{userLevel.coins}</span>
            <span className="text-white/80 text-xs">монет</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
