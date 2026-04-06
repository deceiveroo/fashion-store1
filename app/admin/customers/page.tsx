'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Package, Calendar, DollarSign, User, Trash2, Edit3, Camera, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  image?: string;
  avatar?: string;
  createdAt: string;
  emailVerified?: string | null;
}

export default function CustomersPage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        toast.error('Не удалось загрузить клиентов');
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Ошибка загрузки клиентов');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredUsers(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Клиент удален');
        setUsers(users.filter(user => user.id !== userId));
        if (selectedUser?.id === userId) {
          setShowUserModal(false);
          setShowEditModal(false);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка при удалении клиента');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser({ ...user });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleEditChange = (field: keyof User | 'password', value: string) => {
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
        toast.success('Клиент обновлен');
        loadUsers(); // Refresh the user list
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка при обновлении клиента');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout currentPage="customers">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление клиентами</h1>
          <p className="text-gray-600 mt-1">Всего клиентов: {users.length}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск клиентов..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={loadUsers}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Нет клиентов</h3>
              <p className="mt-1 text-gray-500">Не найдено клиентов по вашему запросу.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата регистрации
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar || user.image ? (
                              <img className="h-10 w-10 rounded-full" src={user.avatar || user.image} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.name || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          {user.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'user' ? 'bg-gray-100 text-gray-800' : 
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'support' ? 'bg-green-100 text-green-800' :
                            user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Edit Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Редактировать клиента</h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="relative flex-shrink-0 h-16 w-16">
                      {editingUser.avatar || editingUser.image ? (
                        <img className="h-16 w-16 rounded-full" src={editingUser.avatar || editingUser.image} alt="" />
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
                        <>
                          <Save className="h-4 w-4 mr-1" /> Сохранить
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(editingUser.id!)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Удалить
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