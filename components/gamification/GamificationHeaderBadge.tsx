'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface UserLevel {
  level: number;
  xp: number;
  xp_to_next_level: number;
  coins: number;
}

export default function GamificationHeaderBadge() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLevel();
  }, []);

  const fetchUserLevel = async () => {
    try {
      const response = await fetch('/api/gamification/profile');
      if (response.ok) {
        const data = await response.json();
        setUserLevel(data);
      }
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
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
      >
        {/* Level Badge */}
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">{userLevel.level}</span>
        </div>

        {/* XP Progress Bar */}
        <div className="hidden sm:flex flex-col gap-0.5 min-w-[60px]">
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <span className="text-white/90 text-[10px] font-medium">
            {userLevel.xp}/{userLevel.xp_to_next_level}
          </span>
        </div>

        {/* Coins */}
        <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <span className="text-white font-bold text-xs">{userLevel.coins}</span>
        </div>
      </motion.div>
    </Link>
  );
}
