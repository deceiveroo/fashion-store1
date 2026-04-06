'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Users, Search, Mail, User, Trash2, Edit3, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Row {
  id: string;
  email: string;
  name: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  image?: string;
  avatar?: string;
  status?: string;
  createdAt: string;
  emailVerified?: string | null;
}

export default function AdminStaffPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filteredRows, setFilteredRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Row | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Row> & { password?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/staff', { credentials: 'include' });
        if (!r.ok) throw new Error('fail');
        const data = await r.json();
        const list = Array.isArray(data) ? data : data.staff ?? [];
        setRows(list.map((u: Row) => ({ ...u, status: u.status ?? 'active' })));
      } catch {
        toast.error('Не удалось загрузить команду');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    filterRows();
  }, [rows, q]);

  const filterRows = () => {
    let filtered = [...rows];

    if (q) {
      filtered = filtered.filter(row =>
        row.email.toLowerCase().includes(q.toLowerCase()) ||
        (row.firstName && row.firstName.toLowerCase().includes(q.toLowerCase())) ||
        (row.lastName && row.lastName.toLowerCase().includes(q.toLowerCase())) ||
        (row.name && row.name.toLowerCase().includes(q.toLowerCase()))
      );
    }

    setFilteredRows(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Сотрудник удален');
        setRows(rows.filter(user => user.id !== userId));
        if (selectedUser?.id === userId) {
          setShowUserModal(false);
          setShowEditModal(false);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка при удалении сотрудника');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const viewUserDetails = (user: Row) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const openEditUser = (user: Row) => {
    setEditingUser({ ...user });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleEditChange = (field: keyof Row | 'password', value: string) => {
    setEditingUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { 
      toast.error('Пожалуйста, выберите изображение'); 
      return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
      toast.error('Файл слишком большой (макс. 5MB)'); 
      return; 
    }
    
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: fd,
        credentials: 'include',
      });
      
      if (!res.ok) { 
        const err = await res.json(); 
        throw new Error(err.error || 'Ошибка загрузки'); 
      }
      
      const data = await res.json();
      setEditingUser(prev => ({ ...prev, avatar: data.url }));
      toast.success('Аватар загружен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveUserChanges = async () => {
    if (!editingUser.id) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: editingUser.id,
          updates: {
            firstName: editingUser.firstName,
            lastName: editingUser.lastName,
            phone: editingUser.phone,
            role: editingUser.role,
            image: editingUser.image,
            avatar: editingUser.avatar,
            ...(editingUser.password && { password: editingUser.password }),
          }
        })
      });

      if (response.ok) {
        toast.success('Сотрудник обновлен');
        // Обновляем список сотрудников
        (async () => {
          try {
            const r = await fetch('/api/admin/staff', { credentials: 'include' });
            if (!r.ok) throw new Error('fail');
            const data = await r.json();
            const list = Array.isArray(data) ? data : data.staff ?? [];
            setRows(list.map((u: Row) => ({ ...u, status: u.status ?? 'active' })));
          } catch {
            toast.error('Не удалось загрузить команду');
          }
        })();
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка при обновлении сотрудника');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout currentPage="staff">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Команда</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Сотрудники и администраторы магазина</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            placeholder="Поиск по email или имени"
            className="w-full rounded-lg border border-zinc-200 py-2 pl-10 pr-4 dark:border-zinc-700 dark:bg-zinc-900"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Пользователь</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Роль</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    Загрузка…
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    Нет данных
                  </td>
                </tr>
              ) : (
                filteredRows.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                          {(u.firstName || u.lastName || u.name || u.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Mail className="h-3 w-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'support' ? 'bg-green-100 text-green-800' :
                          u.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.status}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditUser(u)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          <Users className="mr-1 inline h-3 w-3" />
          Отображаются только сотрудники (admin, manager, support).
        </p>

        {/* User Edit Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Редактировать сотрудника</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="relative shrink-0 h-16 w-16">
                      {editingUser.avatar || editingUser.image ? (
                        <img 
                          className="h-16 w-16 rounded-full object-cover" 
                          src={editingUser.avatar || editingUser.image} 
                          alt="Avatar" 
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-8 w-8 text-purple-600" />
                        </div>
                      )}
                      <button
                        onClick={handleAvatarClick}
                        className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <Camera size={14} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium">
                        {editingUser.firstName} {editingUser.lastName}
                      </h4>
                      <p className="text-gray-500">{editingUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                      <input
                        type="text"
                        value={editingUser.firstName || ''}
                        onChange={(e) => handleEditChange('firstName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                      <input
                        type="text"
                        value={editingUser.lastName || ''}
                        onChange={(e) => handleEditChange('lastName', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editingUser.email || ''}
                        disabled
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                      <input
                        type="text"
                        value={editingUser.phone || ''}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                      <select
                        value={editingUser.role || 'user'}
                        onChange={(e) => handleEditChange('role', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="user">User (Клиент)</option>
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="support">Support</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Аватар URL</label>
                      <input
                        type="text"
                        value={editingUser.avatar || ''}
                        onChange={(e) => handleEditChange('avatar', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль (необязательно)</label>
                      <input
                        type="password"
                        value={editingUser.password || ''}
                        onChange={(e) => handleEditChange('password', e.target.value)}
                        placeholder="Оставьте пустым, чтобы не менять"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={saveUserChanges}
                      disabled={isSaving}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Сохранение...
                        </>
                      ) : (
                        'Сохранить'
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(editingUser.id!)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleAvatarChange} 
          className="hidden" 
        />
      </div>
    </AdminLayout>
  );
}