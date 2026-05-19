import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface OrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

export interface OrderRecipient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  discount: number;
  deliveryPrice: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  recipient?: OrderRecipient;
  comment?: string;
  items?: OrderItem[];
}

export interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
  };
  image?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  last4: string;
  brand: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  orderId?: string;
  discountAmount: string;
  usedAt: string;
  couponCode: string;
  couponDiscount: number;
  couponType: string;
  couponActive: boolean;
  couponExpiresAt?: string;
  isExpired: boolean;
  isValid: boolean;
}

export interface NotificationSettings {
  ordersEmail?: boolean;
  ordersPush?: boolean;
  ordersSms?: boolean;
  promotionsEmail?: boolean;
  promotionsPush?: boolean;
  promotionsSms?: boolean;
  wishlistEmail?: boolean;
  wishlistPush?: boolean;
  wishlistSms?: boolean;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

export function useProfileData() {
  const router = useRouter();
  
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({});
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load profile data
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', {
        credentials: 'include',
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
      } else if (res.status === 401) {
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('[PROFILE] Error loading profile:', error);
    }
  }, [router]);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('[ORDERS] Error loading orders:', error);
      setOrders([]);
    }
  }, []);

  // Load wishlist
  const loadWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/wishlist', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.items || []);
      }
    } catch (error) {
      console.error('[WISHLIST] Error loading wishlist:', error);
      setWishlist([]);
    }
  }, []);

  // Check achievements
  const checkAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.unlocked && data.unlocked.length > 0) {
          console.log(`🏆 Unlocked ${data.count} achievements:`, data.unlocked);
          data.unlocked.forEach((achievement: any) => {
            if (achievement.achievement) {
              toast.success(
                `🎉 Достижение разблокировано: ${achievement.achievement.name}! +${achievement.achievement.xp} XP, +${achievement.achievement.coins} монет`,
                { duration: 5000 }
              );
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  }, []);

  // Load payment methods
  const loadPaymentMethods = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/payments', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.methods || []);
      }
    } catch (error) {
      console.error('[PAYMENTS] Error loading payments:', error);
      setPaymentMethods([]);
    }
  }, []);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/sessions', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('[SESSIONS] Error loading sessions:', error);
      setSessions([]);
    }
  }, []);

  // Load notification settings
  const loadNotificationSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/notifications', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.settings || {});
      }
    } catch (error) {
      console.error('[NOTIFICATIONS] Error loading notifications:', error);
      setNotifications({});
    }
  }, []);

  // Load coupons
  const loadCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/coupons', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('[COUPONS] Error loading coupons:', error);
      setCoupons([]);
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    await Promise.all([
      loadProfile(),
      loadOrders(),
      loadWishlist(),
      loadPaymentMethods(),
      loadSessions(),
      loadNotificationSettings(),
      loadCoupons(),
    ]);
    setIsLoadingData(false);
    
    // Check achievements after loading profile (in background)
    checkAchievements();
  }, [loadProfile, loadOrders, loadWishlist, loadPaymentMethods, loadSessions, loadNotificationSettings, loadCoupons, checkAchievements]);

  return {
    // Data
    orders,
    wishlist,
    paymentMethods,
    sessions,
    coupons,
    notifications,
    formData,
    isLoadingData,
    
    // Setters
    setOrders,
    setWishlist,
    setPaymentMethods,
    setSessions,
    setCoupons,
    setNotifications,
    setFormData,
    
    // Loaders
    loadProfile,
    loadOrders,
    loadWishlist,
    loadPaymentMethods,
    loadSessions,
    loadNotificationSettings,
    loadCoupons,
    loadAllData,
    checkAchievements,
  };
}
