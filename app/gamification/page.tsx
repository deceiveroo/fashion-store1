'use client';

import GamificationDashboard from '@/components/gamification/GamificationDashboard';

export default function GamificationPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Premium Header */}
          <div className="relative mb-12">
            {/* Subtle accent glow instead of heavy blobs */}
            <div
              className="pointer-events-none absolute -top-16 -left-10 w-72 h-72 rounded-full opacity-60"
              style={{ background: 'radial-gradient(circle, rgba(var(--fc-accent-rgb) / 0.12), transparent 70%)' }}
            />

            <div className="relative">
              <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">
                Достижения и награды
              </h1>
              <p className="text-base text-[var(--text-secondary)] max-w-2xl">
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
