'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Camera, Mail, Phone, MapPin, Lock, Edit3, ChevronRight, LogOut, Package, Heart, User, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const { update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/signin'); return; }
    loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          avatar: data.avatar || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Пожалуйста, выберите изображение'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл слишком большой (макс. 5MB)'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Ошибка загрузки'); }
      const data = await res.json();
      setFormData(prev => ({ ...prev, avatar: data.url }));
      await saveProfile({ avatar: data.url });
      await refreshUser();
      // Update NextAuth session to reflect new avatar
      if (updateSession) {
        await updateSession();
      }
      toast.success('Аватар обновлен');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async (updates: any) => {
    const token = localStorage.getItem('auth-token');
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) { const error = await res.json(); throw new Error(error.message || 'Ошибка сохранения'); }
    return res.json();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      });
      await refreshUser();
      // Update NextAuth session
      if (updateSession) {
        await updateSession();
      }
      toast.success('Профиль успешно обновлен');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error('Новые пароли не совпадают'); return; }
    if (passwordData.newPassword.length < 6) { toast.error('Пароль должен быть минимум 6 символов'); return; }
    setIsChangingPassword(true);
    try {
      await saveProfile({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success('Пароль успешно изменен');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при смене пароля');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = () => `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'U';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-pink-50 to-purple-50 pt-16">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 relative overflow-hidden pt-16">
      {/* Анимированные элементы фона */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full bg-pink-200/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 30}px`,
              height: `${Math.random() * 100 + 30}px`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 relative inline-block">
            <span className="relative z-10">Мой Профиль</span>

          </h1>
          <p className="text-gray-600">Управляйте вашими данными и настройками</p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - User Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="text-indigo-600" size={20} /> Личная информация
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm shadow-md"
                >
                  <Edit3 size={16} /> Редактировать
                </button>
              )}
            </div>

            <div className="flex items-start gap-8 flex-col md:flex-row">

              {/* Avatar */}
              <div className="shrink-0 flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-light text-gray-400">{getInitials()}</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    {isUploading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full" />
                    ) : (
                      <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </motion.div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <p className="mt-3 text-sm text-gray-500">Нажмите для изменения</p>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                        placeholder="Ваше имя"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5 px-4 bg-white/70 rounded-lg border border-gray-200 backdrop-blur-sm">{formData.firstName || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                        placeholder="Ваша фамилия"
                      />
                    ) : (
                      <p className="text-gray-900 py-2.5 px-4 bg-white/70 rounded-lg border border-gray-200 backdrop-blur-sm">{formData.lastName || '—'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-3 bg-white/70 border border-gray-200 rounded-lg px-4 py-2.5 backdrop-blur-sm">
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-900 truncate">{formData.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                        placeholder="+7 (xxx) xxx-xx-xx"
                      />
                    ) : (
                      <div className="flex items-center gap-3 bg-white/70 border border-gray-200 rounded-lg px-4 py-2.5 backdrop-blur-sm">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-900 truncate">{formData.phone || 'Не указан'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      placeholder="Город, улица, дом, квартира"
                    />
                  ) : (
                    <div className="flex items-start gap-3 bg-white/70 border border-gray-200 rounded-lg px-4 py-2.5 min-h-[48px] backdrop-blur-sm">
                      <MapPin size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-900">{formData.address || 'Адрес не указан'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save/Cancel buttons */}
            {isEditing && (
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-md"
                >
                  {isSaving ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Сохранение...
                    </>
                  ) : 'Сохранить изменения'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); loadProfile(); }}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors duration-300"
                >
                  Отмена
                </button>
              </div>
            )}
          </motion.div>

          {/* Right Column - Menu & Actions */}
          <div className="space-y-6">

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50"
            >
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Settings className="text-indigo-600" size={20} /> Быстрые действия
              </h3>
              <div className="space-y-3">
                <Link href="/profile/orders" className="flex items-center justify-between w-full p-4 bg-white/50 hover:bg-indigo-50 rounded-xl transition-colors group border border-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg text-indigo-600">
                      <Package size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Мои заказы</p>
                      <p className="text-xs text-gray-500">Посмотреть историю заказов</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600" />
                </Link>
                <Link href="/favorites" className="flex items-center justify-between w-full p-4 bg-white/50 hover:bg-indigo-50 rounded-xl transition-colors group border border-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg text-indigo-600">
                      <Heart size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Избранные товары</p>
                      <p className="text-xs text-gray-500">Список желаний</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600" />
                </Link>
              </div>
            </motion.div>

            {/* Security Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="text-indigo-600" size={20} /> Безопасность
                </h3>
                {!showPasswordChange && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                  >
                    Изменить
                  </button>
                )}
              </div>

              {showPasswordChange ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Введите текущий пароль"
                      className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Введите новый пароль"
                      className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Подтверждение пароля</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Подтвердите новый пароль"
                      className="w-full bg-white/70 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={isChangingPassword} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                      {isChangingPassword ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          Сохранение...
                        </>
                      ) : 'Сохранить'}
                    </button>
                    <button type="button" onClick={() => { setShowPasswordChange(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition-colors duration-300">
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg text-green-600">
                      <Lock size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Пароль защищён</p>
                      <p className="text-xs text-gray-500">Последнее изменение: недавно</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Logout Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-4 rounded-2xl flex items-center justify-center transition-all duration-300 group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-white" />
                  <span className="font-medium">Выйти из аккаунта</span>
                </div>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}