import AdminSessionsManager from '@/components/admin/AdminSessionsManager';

export default function AdminSessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Управление сессиями
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Просмотр и управление активными сессиями всех пользователей
        </p>
      </div>

      <AdminSessionsManager />
    </div>
  );
}
