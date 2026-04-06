// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  deliveryPrice: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  recipient: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
  };
  comment?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  phone: string;
  orders: Order[];
  image?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Относительный `/api` — всегда тот же хост и порт, что и у страницы (иначе при dev на :3001 ломается fetch на :3000). */
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    return null;
  };

  const setToken = (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  };

  const removeToken = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        // Токен истек или невалиден - удаляем его
        console.warn('Token expired or invalid, logging out');
        removeToken();
        setUser(null);
      }
      // Для других ошибок (500 и т.д.) просто не устанавливаем пользователя
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Не удаляем токен при сетевых ошибках - возможно сервер временно недоступен
      if (error.name === 'AbortError') {
        console.warn('Auth check timeout (30s)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = getToken();
    if (!token) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        throw new Error('Failed to refresh user data');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Время ожидания запроса истекло. Проверьте подключение к интернету.');
      }
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const { user: userData, token } = await response.json();
      
      setToken(token);
      setUser(userData);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Время ожидания запроса истекло. Проверьте подключение к интернету.');
      }
      throw new Error(error instanceof Error ? error.message : 'Ошибка подключения к серверу');
    }
  };

  const register = async (userData: { email: string; password: string; firstName: string; lastName: string }): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || 'Registration failed');
      }

      const { user: newUser, token } = await response.json();
      
      setToken(token);
      setUser(newUser);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Время ожидания запроса истекло. Проверьте подключение к интернету.');
      }
      throw new Error(error instanceof Error ? error.message : 'Ошибка подключения к серверу');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const token = getToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to change password' }));
        throw new Error(errorData.message || 'Failed to change password');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Время ожидания запроса истекло. Проверьте подключение к интернету.');
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  const logout = (): void => {
    setUser(null);
    removeToken();
  };

  const addOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
    const token = getToken();
    if (!token) {
      throw new Error('User not authenticated. Please log in to complete your order.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      // Добавляем валидацию данных заказа перед отправкой
      if (!order.items || order.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      if (!order.recipient || !order.recipient.firstName || !order.recipient.lastName || !order.recipient.address) {
        throw new Error('Recipient information is incomplete');
      }

      console.log('Sending order data:', JSON.stringify(order, null, 2));
      
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(order),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: 'Failed to create order' };
        }
        
        // Добавляем более детальное логирование ошибок
        console.error('Failed to create order:', {
          error: errorData,
          message: errorData.message || 'Unknown error',
          details: errorData.details || undefined
        });
        
        throw new Error(errorData.message || 'Failed to create order');
      }

      const newOrder = await response.json();
      console.log('Received order response:', newOrder);

      // Обновляем список заказов пользователя
      setUser(prev => prev ? {
        ...prev,
        orders: [...prev.orders, newOrder]
      } : null);

      return newOrder;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Время ожидания запроса истекло. Проверьте подключение к интернету.');
      }
      console.error('Failed to create order:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create order');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    const token = getToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update order status' }));
        throw new Error(errorData.message || 'Failed to update order status');
      }

      const updatedOrder = await response.json();
      
      // Обновляем заказ в списке
      setUser(prev => prev ? {
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      } : null);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Время ожидания запроса истекло. Проверьте подключение к интернету.');
      }
      console.error('Failed to update order status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update order status');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      changePassword,
      addOrder,
      updateOrderStatus,
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}