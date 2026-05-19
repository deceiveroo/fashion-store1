import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ProfileFormData, PaymentMethod } from './useProfileData';

interface UseProfileActionsProps {
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
  paymentMethods: PaymentMethod[];
  loadPaymentMethods: () => Promise<void>;
  loadWishlist: () => Promise<void>;
  loadSessions: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useProfileActions({
  formData,
  setFormData,
  paymentMethods,
  loadPaymentMethods,
  loadWishlist,
  loadSessions,
  refreshUser,
}: UseProfileActionsProps) {
  const router = useRouter();
  
  // Local states for actions
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Save profile
  const saveProfile = async (updates: any) => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) { 
      const error = await res.json(); 
      throw new Error(error.message || 'Ошибка сохранения'); 
    }
    return res.json();
  };

  // Handle save profile
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
      toast.success('Профиль успешно обновлен');
      
      // Check profile completion achievements
      fetch('/api/gamification/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'profile_complete' }),
        credentials: 'include'
      }).catch(err => console.error('Achievement check failed:', err));
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>, fileInputRef: React.RefObject<HTMLInputElement>) => {
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
      const oldAvatar = formData.avatar;
      if (oldAvatar && oldAvatar.includes('supabase')) {
        fd.append('oldUrl', oldAvatar);
      }
      
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      
      if (!res.ok) { 
        const err = await res.json(); 
        throw new Error(err.error || 'Ошибка загрузки'); 
      }
      
      const data = await res.json();
      setFormData({ ...formData, avatar: data.url });
      await saveProfile({ avatar: data.url });
      await refreshUser();
      toast.success('Аватар обновлен');
      
      // Check avatar achievement
      fetch('/api/gamification/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'profile_complete' }),
        credentials: 'include'
      }).catch(err => console.error('Achievement check failed:', err));
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle add card
  const handleAddCard = async () => {
    if (!newCard.number || !newCard.holderName || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const res = await fetch('/api/profile/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cardNumber: newCard.number.replace(/\s/g, ''),
          holderName: newCard.holderName,
          expiryMonth: newCard.expiryMonth,
          expiryYear: newCard.expiryYear,
          cvv: newCard.cvv,
          isDefault: paymentMethods.length === 0,
        }),
      });

      if (!res.ok) throw new Error('Ошибка добавления карты');

      await loadPaymentMethods();
      setShowAddCard(false);
      setNewCard({ number: '', holderName: '', expiryMonth: '', expiryYear: '', cvv: '' });
      toast.success('Карта добавлена');
    } catch (error) {
      toast.error('Ошибка при добавлении карты');
    }
  };

  // Handle remove payment method
  const handleRemovePaymentMethod = async (methodId: string) => {
    try {
      await fetch(`/api/profile/payments?id=${methodId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await loadPaymentMethods();
      toast.success('Способ оплаты удален');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  // Handle set default payment
  const handleSetDefaultPayment = async (methodId: string) => {
    try {
      await fetch('/api/profile/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ methodId, isDefault: true }),
      });
      await loadPaymentMethods();
      toast.success('Способ оплаты по умолчанию изменен');
    } catch (error) {
      toast.error('Ошибка при обновлении');
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await fetch(`/api/profile/wishlist?productId=${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await loadWishlist();
      toast.success('Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  // Handle terminate session
  const handleTerminateSession = async (sessionId: string) => {
    try {
      await fetch(`/api/profile/sessions?id=${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await loadSessions();
      toast.success('Сессия завершена');
    } catch (error) {
      toast.error('Ошибка при завершении сессии');
    }
  };

  // Handle export data
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/profile/export', {
        credentials: 'include',
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Данные экспортированы');
    } catch (error) {
      toast.error('Ошибка при экспорте');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    // States
    isSaving,
    isUploading,
    showAddCard,
    newCard,
    isExporting,
    showDeleteConfirm,
    deleteConfirmText,
    
    // Setters
    setIsSaving,
    setIsUploading,
    setShowAddCard,
    setNewCard,
    setIsExporting,
    setShowDeleteConfirm,
    setDeleteConfirmText,
    
    // Actions
    handleSave,
    handleAvatarChange,
    handleAddCard,
    handleRemovePaymentMethod,
    handleSetDefaultPayment,
    handleRemoveFromWishlist,
    handleTerminateSession,
    handleExportData,
    saveProfile,
  };
}
