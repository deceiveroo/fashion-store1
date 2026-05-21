'use client';

import { useState } from 'react';
import GamificationDashboard from '@/components/gamification/GamificationDashboard';

export default function GamificationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Premium Header */}
          <div className="relative mb-12">
            {/* Decorative elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -top-10 -right-20 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Достижения и награды
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                Развивайте свой профиль, открывайте достижения и получайте эксклюзивные награды
              </p>
            </div>
          </div>

          {/* Main Dashboard - Premium Style */}
          <GamificationDashboard />
        </div>
      </div>
    </div>
  );
}
