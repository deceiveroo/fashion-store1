import GamificationDashboard from '@/components/gamification/GamificationDashboard';

export default function GamificationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4">
              🎮 Система достижений
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Зарабатывайте опыт, открывайте достижения и получайте награды!
            </p>
          </div>

          <GamificationDashboard />
        </div>
      </div>
    </div>
  );
}
