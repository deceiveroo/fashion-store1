'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Camera, LogOut, Package, Heart, User, CreditCard, Bell, Shield, FileText, Ticket
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import GamificationProfileWidget from '@/components/gamification/GamificationProfileWidget';
import NotificationsPanel from '@/components/profile/NotificationsPanel';
import HolographicTabs from '@/components/profile/HolographicTabs';
import { useProfileData } from './hooks/useProfileData';
import { useProfileActions } from './hooks/useProfileActions';
import PersonalInfoSection from '@/components/profile/sections/PersonalInfoSection';
import OrdersSection from '@/components/profile/sections/OrdersSection';
import WishlistSection from '@/components/profile/sections/WishlistSection';
import CouponsSection from '@/components/profile/sections/CouponsSection';
import PaymentsSection from '@/components/profile/sections/PaymentsSection';
import SecuritySection from '@/components/profile/sections/SecuritySection';
import PrivacySection from '@/components/profile/sections/PrivacySection';

type Section = 'personal' | 'security' | 'payments' | 'notifications' | 'orders' | 'wishlist' | 'privacy' | 'coupons';

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [isEditing, setIsEditing] = useState(false);

  // Use custom hooks
  const profileData = useProfileData();
  const profileActions = useProfileActions({
    formData: profileData.formData,
    setFormData: profileData.setFormData,
    paymentMethods: profileData.paymentMethods,
    loadPaymentMethods: profileData.loadPaymentMethods,
    loadWishlist: profileData.loadWishlist,
    loadSessions: profileData.loadSessions,
    refreshUser,
  });

  useEffect(() => {
    if (authLoading || sessionStatus === 'loading') return;
    
    if (!user && !session) {
      fetch('/api/profile', { credentials: 'include' })
        .then(res => {
          if (res.ok) refreshUser();
          else router.push('/auth/signin');
        })
        .catch(() => router.push('/auth/signin'));
      return;
    }
    
    profileData.loadAllData();
  }, [user, authLoading, session, sessionStatus]);

  const handleAvatarClick = () => fileInputRef.current?.click();
  
  const getInitials = () => `${profileData.formData.firstName?.[0] || ''}${profileData.formData.lastName?.[0] || ''}`.toUpperCase() || 'U';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-pink-50 to-purple-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 pt-16">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const sections = [
    { id: 'personal' as Section, icon: User, title: 'Личная информация', count: null },
    { id: 'orders' as Section, icon: Package, title: 'Мои заказы', count: profileData.orders.length },
    { id: 'wishlist' as Section, icon: Heart, title: 'Избранное', count: profileData.wishlist.length },
    { id: 'coupons' as Section, icon: Ticket, title: 'Мои промокоды', count: profileData.coupons.length },
    { id: 'payments' as Section, icon: CreditCard, title: 'Способы оплаты', count: profileData.paymentMethods.length },
    { id: 'security' as Section, icon: Shield, title: 'Безопасность', count: profileData.sessions.length },
    { id: 'notifications' as Section, icon: Bell, title: 'Уведомления', count: null },
    { id: 'privacy' as Section, icon: FileText, title: 'Конфиденциальность', count: null },
  ];

  const holographicTabs = [
    { id: 'personal', label: 'Личные данные', icon: User, color: '#8B5CF6', colorRGB: '139, 92, 246' },
    { id: 'orders', label: 'Заказы', icon: Package, color: '#EC4899', colorRGB: '236, 72, 153' },
    { id: 'wishlist', label: 'Избранное', icon: Heart, color: '#F59E0B', colorRGB: '245, 158, 11' },
    { id: 'coupons', label: 'Промокоды', icon: Ticket, color: '#10B981', colorRGB: '16, 185, 129' },
    { id: 'payments', label: 'Оплата', icon: CreditCard, color: '#3B82F6', colorRGB: '59, 130, 246' },
    { id: 'security', label: 'Безопасность', icon: Shield, color: '#EF4444', colorRGB: '239, 68, 68' },
    { id: 'notifications', label: 'Уведомления', icon: Bell, color: '#8B5CF6', colorRGB: '139, 92, 246' },
    { id: 'privacy', label: 'Конфиденциальность', icon: FileText, color: '#6366F1', colorRGB: '99, 102, 241' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Мой Профиль
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Управляйте вашими данными и настройками</p>
        </motion.div>

        {/* Gamification Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <GamificationProfileWidget />
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-5 mb-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 overflow-hidden flex items-center justify-center cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {profileData.formData.avatar ? (
                <img
                  src={profileData.formData.avatar}
                  alt={profileData.formData.firstName || 'Аватар'}
                  className="w-full h-full object-cover"
                  onError={() => profileData.setFormData({ ...profileData.formData, avatar: '' })}
                />
              ) : (
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{getInitials()}</span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {profileActions.isUploading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full" />
                ) : (
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </motion.div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => profileActions.handleAvatarChange(e, fileInputRef as React.RefObject<HTMLInputElement>)} className="hidden" />

            {/* User Info */}
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {profileData.formData.firstName} {profileData.formData.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{profileData.formData.email}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">Активен</span>
                {profileData.orders.length > 0 && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                    {profileData.orders.length} заказов
                  </span>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button onClick={() => { logout(); router.push('/'); }} className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg">
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </motion.div>

        {/* Holographic Tab Universe */}
        <HolographicTabs tabs={holographicTabs} activeTab={activeSection} onTabChange={(tabId) => setActiveSection(tabId as Section)}>
          <div className="space-y-6">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              if (!isActive) return null;

              return (
                <motion.div key={section.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {/* Section Header */}
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-100 dark:border-purple-900/50 overflow-hidden mb-6">
                    <div className="w-full p-6 flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                        <Icon className="text-white" size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h3>
                        {section.count !== null && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{section.count} элементов</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-100 dark:border-purple-900/50 overflow-hidden p-6">
                    {section.id === 'personal' && (
                      <PersonalInfoSection
                        formData={profileData.formData}
                        setFormData={profileData.setFormData}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        isSaving={profileActions.isSaving}
                        handleSave={profileActions.handleSave}
                        loadProfile={profileData.loadProfile}
                      />
                    )}

                    {section.id === 'orders' && <OrdersSection orders={profileData.orders} />}

                    {section.id === 'wishlist' && (
                      <WishlistSection
                        wishlist={profileData.wishlist}
                        handleRemoveFromWishlist={profileActions.handleRemoveFromWishlist}
                      />
                    )}

                    {section.id === 'coupons' && (
                      <CouponsSection coupons={profileData.coupons} isLoadingData={profileData.isLoadingData} />
                    )}

                    {section.id === 'payments' && (
                      <PaymentsSection
                        paymentMethods={profileData.paymentMethods}
                        showAddCard={profileActions.showAddCard}
                        setShowAddCard={profileActions.setShowAddCard}
                        newCard={profileActions.newCard}
                        setNewCard={profileActions.setNewCard}
                        handleAddCard={profileActions.handleAddCard}
                        handleRemovePaymentMethod={profileActions.handleRemovePaymentMethod}
                        handleSetDefaultPayment={profileActions.handleSetDefaultPayment}
                      />
                    )}

                    {section.id === 'security' && (
                      <SecuritySection sessions={profileData.sessions} isLoadingData={profileData.isLoadingData} />
                    )}

                    {section.id === 'notifications' && (
                      <NotificationsPanel 
                        notifications={profileData.notifications} 
                        setNotifications={profileData.setNotifications} 
                      />
                    )}

                    {section.id === 'privacy' && (
                      <PrivacySection
                        isExporting={profileActions.isExporting}
                        showDeleteConfirm={profileActions.showDeleteConfirm}
                        deleteConfirmText={profileActions.deleteConfirmText}
                        setDeleteConfirmText={profileActions.setDeleteConfirmText}
                        setShowDeleteConfirm={profileActions.setShowDeleteConfirm}
                        handleExportData={profileActions.handleExportData}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </HolographicTabs>
      </div>
    </div>
  );
}
