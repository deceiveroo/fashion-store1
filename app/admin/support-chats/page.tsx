'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, CheckCircle, Archive, User, Bot, Shield, Trash2, RefreshCw, Zap, Clock, Users, BarChart3, Star, Check, CheckCheck, ArrowLeft, Lock, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';
import SLADashboard from '@/components/admin/SLADashboard';
import { TypingIndicatorManager } from '@/lib/typing-indicator';
import { supabase } from '@/lib/supabase-client';

interface Msg { 
  id: string; 
  sessionId: string; 
  message: string; 
  sender: 'user'|'ai'|'admin';
  senderName?: string | null;
  senderAvatar?: string | null;
  createdAt: string;
  isRead?: boolean;
  readByAdmin?: boolean;
  readByUser?: boolean;
}

interface Session { 
  id: string; 
  sessionId: string; 
  userId?: string | null;
  userEmail: string|null; 
  userName: string|null;
  userAvatar?: string | null;
  userImage?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  status: 'active'|'resolved'|'archived'; 
  messageCount: number|null; 
  firstMessage: string|null; 
  lastMessageAt: string|null; 
  aiDisabled: boolean|null; 
  operatorRating?: number | null;
  adminName?: string | null;
  adminAvatar?: string | null;
  adminEmail?: string | null;
  takenOverBy?: string | null;
  createdAt: string;
}

function SupportChatsPage() {
  const { showConfirm } = useConfirm();
  const { data: authSession } = useSession();
  const currentAdminId = authSession?.user?.id ?? null;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sel, setSel] = useState<Session|null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all'|'active'|'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'chats'|'analytics'>('chats');
  const [userTyping, setUserTyping] = useState(false); // Пользователь печатает
  const typingManagerRef = useRef<TypingIndicatorManager | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<Session|null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const sessionsChannelRef = useRef<any>(null);
  const taken = sel?.aiDisabled === true;
  // Чат ведёт ИМЕННО текущий админ (можно писать/открепляться/завершать).
  const mine = taken && !!currentAdminId && sel?.takenOverBy === currentAdminId;
  // Чат перехвачен ДРУГИМ оператором — текущий не может вмешиваться.
  const lockedByOther = taken && !!sel?.takenOverBy && sel.takenOverBy !== currentAdminId;
  // ИИ передал диалог человеку, но никто ещё не перехватил — ждёт оператора.
  const needsOperator = taken && !sel?.takenOverBy;

  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const r = await fetch(`/api/admin/support-chats/${encodeURIComponent(sessionId)}`);
      if (!r.ok) return;
      const d = await r.json();
      // Guard: if admin already switched to a different chat, drop this response.
      if (selRef.current?.sessionId !== sessionId) return;
      const list: Msg[] = (d.messages || []).map((m: Record<string, unknown>) => ({
        id: String(m.id),
        sessionId: String(m.sessionId ?? m.session_id ?? sessionId),
        message: String(m.message ?? ''),
        sender: (m.sender as Msg['sender']) ?? 'user',
        senderName: m.senderName as string | null | undefined,
        senderAvatar: m.senderAvatar as string | null | undefined,
        createdAt: String(m.createdAt ?? m.created_at ?? new Date().toISOString()),
        isRead: Boolean(m.isRead ?? m.is_read ?? false),
        readByAdmin: Boolean(m.readByAdmin ?? m.read_by_admin ?? false),
        readByUser: Boolean(m.readByUser ?? m.read_by_user ?? false),
      }));
      setMessages(list);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, []);

  useEffect(() => {
    if (!sel) {
      setMessages([]);
      return;
    }
    // Clear messages immediately when switching sessions to avoid showing
    // the previous chat while the new one loads.
    setMessages([]);
    loadMessages(sel.sessionId);

    // Отмечаем сообщения пользователя как прочитанные админом
    const markAsRead = async () => {
      try {
        await fetch('/api/admin/support-chats/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sel.sessionId }),
        });
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    };
    markAsRead();
  }, [sel?.sessionId, loadMessages]);

  const loadSessions = useCallback(async (silent=false) => {
    try {
      const r = await fetch('/api/admin/support-chats');
      if (!r.ok) return;
      const d = await r.json();
      const list: Session[] = d.sessions || [];
      setSessions(list);
      if (!silent) setLoading(false);
      if (selRef.current) {
        const u = list.find(s => s.sessionId === selRef.current!.sessionId);
        if (u) setSel(u);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadSessions();
    subscribeToSessions();
    return () => unsubscribeFromSessions();
  }, [loadSessions]);

  // Supabase Realtime для сообщений
  useEffect(() => {
    if (!sel) {
      setMessages([]);
      // Очищаем канал при закрытии чата
      if (realtimeChannelRef.current) {
        try { supabase.removeChannel(realtimeChannelRef.current); } catch {}
        realtimeChannelRef.current = null;
      }
      return;
    }

    // Capture the sessionId we're subscribing for. If the admin switches to a
    // different chat before this effect tears down, we drop incoming messages
    // for the previous session — otherwise messages from chat A could leak
    // into chat B's UI.
    const subscribedSessionId = sel.sessionId;

    // Сначала удаляем старый канал если есть
    if (realtimeChannelRef.current) {
      try { supabase.removeChannel(realtimeChannelRef.current); } catch {}
      realtimeChannelRef.current = null;
    }

    const channelName = `admin-chat-${subscribedSessionId}`;
    const channel: any = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_chat_messages',
        filter: `session_id=eq.${subscribedSessionId}`,
      },
      (payload: any) => {
        // Guard against stragglers from a channel we already abandoned.
        if (selRef.current?.sessionId !== subscribedSessionId) return;
        const raw = payload.new as Record<string, unknown>;
        const incomingSid = String(raw.session_id ?? raw.sessionId ?? '');
        if (incomingSid && incomingSid !== subscribedSessionId) return;

        const newMsg: Msg = {
          id: String(raw.id),
          sessionId: incomingSid || subscribedSessionId,
          message: String(raw.message ?? ''),
          sender: (raw.sender as Msg['sender']) ?? 'user',
          senderName: (raw.sender_name ?? raw.senderName) as string | null | undefined,
          senderAvatar: (raw.sender_avatar ?? raw.senderAvatar) as string | null | undefined,
          createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
          isRead: Boolean(raw.is_read ?? raw.isRead ?? false),
          readByAdmin: Boolean(raw.read_by_admin ?? raw.readByAdmin ?? false),
          readByUser: Boolean(raw.read_by_user ?? raw.readByUser ?? false),
        };
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id);
          if (exists) return prev;
          return [...prev, newMsg];
        });
      }
    );

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Admin chat realtime connected:', subscribedSessionId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Admin chat realtime error:', subscribedSessionId);
      }
    });

    channel.__sid = subscribedSessionId;
    realtimeChannelRef.current = channel;

    return () => {
      try { supabase.removeChannel(channel); } catch {}
      if (realtimeChannelRef.current === channel) {
        realtimeChannelRef.current = null;
      }
    };
  }, [sel?.sessionId]);

  // Typing indicator для админа
  useEffect(() => {
    if (sel && sel.aiDisabled) {
      // Инициализируем typing manager для админа
      typingManagerRef.current = new TypingIndicatorManager(sel.sessionId, 'admin');
      typingManagerRef.current.initialize(supabase, (userId, isTyping) => {
        setUserTyping(isTyping);
      });
    } else {
      typingManagerRef.current?.cleanup();
      setUserTyping(false);
    }
    
    return () => {
      typingManagerRef.current?.cleanup();
    };
  }, [sel?.sessionId, sel?.aiDisabled]);

  // Realtime для списка сессий
  const subscribeToSessions = () => {
    const channel = supabase
      .channel('admin-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat_sessions',
        },
        () => {
          // Перезагружаем список при любом изменении
          loadSessions(true);
        }
      )
      .subscribe();

    sessionsChannelRef.current = channel;
  };

  const unsubscribeFromSessions = () => {
    if (sessionsChannelRef.current) {
      supabase.removeChannel(sessionsChannelRef.current);
      sessionsChannelRef.current = null;
    }
  };

  const takeover = async (sid: string) => {
    const r = await fetch('/api/admin/support-chats/takeover', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }),
    });
    if (r.ok) {
      toast.success('Чат перехвачен!');
      setSel(p => p ? { ...p, aiDisabled: true, takenOverBy: currentAdminId, adminName: p.adminName ?? authSession?.user?.name ?? null } : p);
    } else {
      const d = await r.json().catch(() => ({}));
      toast.error(d.error || 'Не удалось перехватить чат');
    }
  };

  const release = async (sid: string) => {
    const r = await fetch('/api/admin/support-chats/release', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }),
    });
    if (r.ok) {
      toast.success('Вы открепились от чата');
      setSel(p => p ? { ...p, aiDisabled: false, takenOverBy: null, adminName: null, adminAvatar: null } : p);
    } else {
      const d = await r.json().catch(() => ({}));
      toast.error(d.error || 'Не удалось открепиться');
    }
  };

  const sendMsg = async () => {
    if (!input.trim() || !sel || sending || !mine) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    try {
      const r = await fetch(`/api/admin/support-chats/${encodeURIComponent(sel.sessionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (r.status === 409) {
        const d = await r.json().catch(() => ({}));
        setInput(msg);
        toast.error(d.error || 'Чат ведёт другой оператор');
        setSending(false);
        return;
      }
      if (!r.ok) throw new Error('Send failed');
      // Не вызываем loadMessages - Realtime обновит автоматически
      toast.success('Сообщение отправлено');
    } catch (err) {
      console.error('Send error:', err);
      setInput(msg);
      toast.error('Ошибка отправки');
    }

    setSending(false);
  };

  const setStatus = async (sid: string, status: string) => {
    await fetch('/api/admin/support-chats', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, status }),
    });
    toast.success('Обновлено'); setSel(p => p ? { ...p, status: status as any } : p);
  };

  const completeChat = async () => {
    if (!sel) return;
    
    const confirmed = await showConfirm({
      title: 'Завершение чата',
      message: 'Завершить этот чат? История сохранится для пользователя и администратора.',
      confirmText: 'Завершить',
      cancelText: 'Отмена',
      variant: 'info',
    });
    
    if (!confirmed) return;
    
    try {
      const r = await fetch(`/api/admin/support-chats/${encodeURIComponent(sel.sessionId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: null, feedback: null }),
      });
      
      if (r.ok) {
        toast.success('Чат завершен');
        setSel(p => p ? { ...p, status: 'resolved' } : p);
      } else {
        toast.error('Ошибка при завершении чата');
      }
    } catch (err) {
      console.error('Complete chat error:', err);
      toast.error('Ошибка при завершении чата');
    }
  };

  const del = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = await showConfirm({
      title: 'Удаление чата',
      message: 'Удалить чат? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    const r = await fetch('/api/admin/support-chats/delete', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }),
    });
    if (r.ok) { toast.success('Удалено'); if (sel?.sessionId === sid) { setSel(null); setMessages([]); } }
    else toast.error('Ошибка');
  };

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);

  // Функция для получения аватара пользователя
  const getUserAvatar = (userEmail: string | null, userName: string | null, userAvatar?: string | null, userImage?: string | null) => {
    // Сначала проверяем реальный аватар из профиля
    if (userAvatar) return userAvatar;
    if (userImage) return userImage;
    // Если нет аватара, используем UI Avatars API с именем
    if (userName || userEmail) {
      const name = userName || (userEmail ? userEmail.split('@')[0] : 'User');
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
    }
    return null; // Гость - будет стандартная иконка
  };

  // Функция для получения имени пользователя
  const getUserName = (session: any) => {
    // Отладка: логируем данные сессии
    console.log('Session data:', {
      userFirstName: session.userFirstName,
      userLastName: session.userLastName,
      userName: session.userName,
      userEmail: session.userEmail
    });
    
    // Приоритет: firstName + lastName > userName > email username > 'Гость'
    if (session.userFirstName || session.userLastName) {
      const fullName = `${session.userFirstName || ''} ${session.userLastName || ''}`.trim();
      if (fullName) return fullName;
    }
    if (session.userName) return session.userName;
    if (session.userEmail) return session.userEmail.split('@')[0];
    return 'Гость';
  };

  // Функция для получения аватара оператора (админа)
  const getAdminAvatar = (adminAvatar?: string | null, adminName?: string | null) => {
    if (adminAvatar) return adminAvatar;
    // Fallback на UI Avatars API
    const name = adminName || 'Admin';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=128`;
  };

  // Функция для получения имени админа
  const getAdminName = (session: Session) => {
    if (session.adminName) return session.adminName;
    if (session.adminEmail) return session.adminEmail.split('@')[0];
    return 'Администратор';
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text)] flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-[var(--admin-accent)]" />
              Чаты поддержки
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">
              Всего чатов: {sessions.length} • Активных: {sessions.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-[var(--admin-text-muted)]">Live режим</span>
            </div>
            <button onClick={() => loadSessions()} className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all">
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Всего чатов', value: sessions.length, icon: MessageCircle, color: 'bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-500/20 dark:to-purple-600/20 text-white dark:text-violet-400' },
            { label: 'Активные', value: sessions.filter(s => s.status === 'active').length, icon: Zap, color: 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-500/20 dark:to-teal-600/20 text-white dark:text-emerald-400' },
            { label: 'Решенные', value: sessions.filter(s => s.status === 'resolved').length, icon: CheckCircle, color: 'bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-500/20 dark:to-cyan-600/20 text-white dark:text-blue-400' },
            { label: 'Перехвачено', value: sessions.filter(s => s.aiDisabled).length, icon: Shield, color: 'bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-500/20 dark:to-orange-600/20 text-white dark:text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 hover:bg-[var(--admin-card-hover)] transition-all backdrop-blur-sm shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--admin-text)]">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} backdrop-blur-sm shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--admin-border)]">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'chats'
                ? 'text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Чаты
            </div>
            {activeTab === 'chats' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--admin-accent)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'analytics'
                ? 'text-[var(--admin-accent)]'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Аналитика SLA
            </div>
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--admin-accent)]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' ? (
          <SLADashboard days={30} />
        ) : (
          // Main Content - Two Column Layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)] min-h-[600px]">
          {/* Left Column - Chat List */}
          <div className="lg:col-span-1 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] backdrop-blur-sm flex flex-col overflow-hidden shadow-sm">
            {/* Filter Tabs */}
            <div className="p-4 border-b border-[var(--admin-border)] flex gap-2">
              {(['all','active','resolved'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    filter===f
                      ? 'bg-[var(--admin-accent)] text-white shadow-lg shadow-violet-500/20'
                      : 'bg-[var(--admin-bg-muted)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-card-hover)] hover:text-[var(--admin-text)]'
                  }`}
                >
                  {f==='all'?'Все':f==='active'?'Активные':'Решенные'}
                </button>
              ))}
            </div>
            
            {/* Chat List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="relative">
                    <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--admin-accent)]/30 border-t-[var(--admin-accent)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[var(--admin-accent)]" />
                    </div>
                  </div>
                </div>
              ) : filtered.length===0 ? (
                <div className="p-8 text-center text-[var(--admin-text-faint)] text-sm flex flex-col items-center gap-3">
                  <MessageCircle className="h-12 w-12 opacity-20" />
                  <p>Нет чатов</p>
                </div>
              ) : (
                filtered.map(s => {
                  const displayName = getUserName(s);
                  const avatarUrl = getUserAvatar(s.userEmail, s.userName, s.userAvatar, s.userImage);
                  return (
                  <div
                    key={s.id}
                    onClick={() => setSel(s)}
                    className={`border-b border-[var(--admin-border-subtle)] p-4 cursor-pointer hover:bg-[var(--admin-card-hover)] transition-all ${
                      sel?.id===s.id ? 'bg-[var(--admin-accent-soft)] border-l-2 border-l-[var(--admin-accent)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {/* Avatar */}
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[var(--admin-border)]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate text-[var(--admin-text)]">{displayName}</span>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            {s.aiDisabled && <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400"/>}
                            <button
                              onClick={(e)=>del(s.sessionId,e)}
                              className="p-1 text-[var(--admin-text-faint)] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4"/>
                            </button>
                          </div>
                        </div>
                        {/* Email пользователя если есть */}
                        {s.userEmail && (
                          <p className="text-xs text-[var(--admin-text-muted)] truncate mt-0.5">{s.userEmail}</p>
                        )}
                        <p className="text-xs text-[var(--admin-text-muted)] truncate mt-1">{s.firstMessage||''}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-[var(--admin-text-faint)] flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {s.messageCount||0}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* Кто отвечает: ИИ / нужен оператор / оператор перехватил */}
                            {!s.aiDisabled ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-400">
                                <Bot className="h-3 w-3" />
                                ИИ
                              </span>
                            ) : !s.takenOverBy ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400 animate-pulse">
                                <Bell className="h-3 w-3" />
                                Нужен оператор
                              </span>
                            ) : null}
                            {/* Информация об админе */}
                            {s.adminName && s.aiDisabled && (() => {
                              const byOther = !!s.takenOverBy && s.takenOverBy !== currentAdminId;
                              return (
                                <div className="flex items-center gap-1">
                                  {s.adminAvatar ? (
                                    <img src={s.adminAvatar} alt={s.adminName} className={`w-5 h-5 rounded-full object-cover border ${byOther ? 'border-amber-500/40' : 'border-emerald-500/30'}`} />
                                  ) : (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${byOther ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-emerald-600'}`}>
                                      {byOther ? <Lock className="h-3 w-3 text-white" /> : <Shield className="h-3 w-3 text-white" />}
                                    </div>
                                  )}
                                  <span className={`text-xs font-medium truncate max-w-[80px] ${byOther ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {s.adminName.split(' ')[0]}
                                  </span>
                                </div>
                              );
                            })()}
                            {/* Рейтинг оператора */}
                            {s.operatorRating && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 font-medium">
                                <Star className="h-3 w-3 fill-current" />
                                {s.operatorRating}/10
                              </span>
                            )}
                            {s.lastMessageAt && (
                              <span className="text-xs text-[var(--admin-text-faint)] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(s.lastMessageAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

          {/* Right Column - Chat Area */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-[#0f0f1a] dark:to-[#1a1a2e] backdrop-blur-sm flex flex-col overflow-hidden shadow-sm">
            {sel ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-base text-gray-900 dark:text-white">{sel.userName||sel.userEmail||'Гость'}</p>
                      <div className="mt-1.5">
                        {mine ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <Shield className="h-3.5 w-3.5" />
                            Вы ведёте чат
                          </span>
                        ) : lockedByOther ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <Lock className="h-3.5 w-3.5" />
                            Ведёт {sel.adminName || 'другой оператор'}
                          </span>
                        ) : needsOperator ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-500/30 bg-red-100 dark:bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                            <Bell className="h-3.5 w-3.5" />
                            ИИ передал оператору — нужен ответ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-500/30 bg-violet-100 dark:bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                            </span>
                            <Bot className="h-3.5 w-3.5" />
                            Сейчас отвечает ИИ
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e)=>del(sel.sessionId,e)} 
                      className="p-2 text-gray-400 dark:text-white/20 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="h-5 w-5"/>
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {lockedByOther ? (
                        <span className="px-4 py-2 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-medium border border-amber-300 dark:border-amber-500/30 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Чат ведёт {sel.adminName || 'другой оператор'}
                        </span>
                      )
                      : !mine
                      ? (
                        <button
                          onClick={()=>takeover(sel.sessionId)}
                          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-xl text-xs font-medium hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20"
                        >
                          Перехватить чат
                        </button>
                      )
                      : (
                        <>
                          <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-medium border border-emerald-300 dark:border-emerald-500/30">
                            Вы ведёте чат
                          </span>
                          <button
                            onClick={()=>release(sel.sessionId)}
                            className="px-4 py-2 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-all border border-amber-300 dark:border-amber-500/30 flex items-center gap-2"
                            title="Передать чат обратно ассистенту — у пользователя оператор пропадёт"
                          >
                            <ArrowLeft className="h-4 w-4"/>
                            Открепиться
                          </button>
                        </>
                      )
                    }
                    {sel.status==='active' && mine && (
                      <button 
                        onClick={completeChat} 
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-xs font-medium hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4"/> 
                        Завершить чат
                      </button>
                    )}
                    {sel.status==='active' && (
                      <button 
                        onClick={()=>setStatus(sel.sessionId,'resolved')} 
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all border border-blue-300 dark:border-blue-500/30 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4"/> 
                        Решено
                      </button>
                    )}
                    <button 
                      onClick={()=>setStatus(sel.sessionId,'archived')} 
                      className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/10 flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4"/> 
                      Архив
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-black/20">
                  {messages.length===0
                    ? (
                      <div className="flex items-center justify-center h-full text-gray-400 dark:text-white/30">
                        <div className="text-center flex flex-col items-center gap-3">
                          <MessageCircle className="h-16 w-16 opacity-20" />
                          <p className="text-sm">Нет сообщений</p>
                        </div>
                      </div>
                    )
                    : messages.map(m => {
                      const isAdmin = m.sender === 'admin';
                      const isUser = m.sender === 'user';
                      const adminDisplayName = m.senderName || (sel ? getAdminName(sel) : 'Оператор');
                      const adminAvatarUrl = getAdminAvatar(m.senderAvatar || sel?.adminAvatar, adminDisplayName);
                      const userAvatar = sel ? getUserAvatar(sel.userEmail, sel.userName, sel.userAvatar, sel.userImage) : null;
                      const userDisplayName = sel ? getUserName(sel) : 'Пользователь';
                      
                      return (
                      <div key={m.id} className={`flex gap-3 ${isUser?'justify-start':'justify-end'}`}>
                        {/* Avatar - слева для пользователя, справа для админа */}
                        {!isAdmin && (
                          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-200 dark:border-white/10">
                            {userAvatar ? (
                              <img src={userAvatar} alt={userDisplayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-white"/>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isUser ? 'bg-gray-100 text-gray-900 border border-gray-200 dark:bg-white/5 dark:text-white dark:border-white/10 rounded-tl-none' :
                          isAdmin ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/30 rounded-tr-none' :
                          'bg-violet-50 text-violet-900 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-500/30 rounded-tr-none'
                        }`}>
                          {/* Sender name for admin messages */}
                          {isAdmin && (
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {adminDisplayName}
                            </p>
                          )}
                          {/* Sender badge for AI messages — makes it unmistakable the bot answered */}
                          {!isAdmin && !isUser && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300 mb-1.5">
                              <Bot className="h-3 w-3" />
                              Ответил ИИ
                            </span>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs opacity-60">
                              {new Date(m.createdAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
                              {isAdmin && ' • Вы'}
                              {!isAdmin && !isUser && ' • Нейросеть'}
                            </span>
                            {/* Галочки прочтения для сообщений админа */}
                            {isAdmin && (
                              m.readByUser ? (
                                <CheckCheck size={14} className="text-emerald-400" />
                              ) : m.isRead ? (
                                <Check size={14} className="opacity-50" />
                              ) : null
                            )}
                          </div>
                        </div>
                        
                        {/* Admin/AI Avatar - справа */}
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-gray-200 dark:border-white/10">
                            {isAdmin && adminAvatarUrl ? (
                              <img src={adminAvatarUrl} alt={adminDisplayName} className="w-full h-full object-cover" />
                            ) : isAdmin ? (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white"/>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white"/>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                  }
                  <div ref={endRef}/>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
                  {lockedByOther ? (
                    <p className="text-xs text-center text-amber-600 dark:text-amber-400 mb-3 flex items-center justify-center gap-2">
                      <Lock className="h-3 w-3" />
                      Чат перехватил {sel.adminName || 'другой оператор'} — вы не можете отвечать
                    </p>
                  ) : !mine ? (
                    <p className="text-xs text-center text-gray-500 dark:text-white/30 mb-3 flex items-center justify-center gap-2">
                      <Shield className="h-3 w-3" />
                      Перехватите чат чтобы писать
                    </p>
                  ) : null}
                  
                  {/* Typing Indicator */}
                  {userTyping && taken && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                      </div>
                      <span>Пользователь печатает...</span>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={input} 
                      onChange={e => {
                        setInput(e.target.value);
                        // Отправляем typing статус
                        if (taken && typingManagerRef.current) {
                          typingManagerRef.current.notifyTyping();
                        }
                      }}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                      placeholder={mine?"Напишите сообщение...":lockedByOther?"Чат ведёт другой оператор":"Сначала перехватите чат..."}
                      disabled={!mine||sending}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 disabled:opacity-40 transition-all"
                    />
                    <button
                      onClick={sendMsg}
                      disabled={!input.trim()||sending||!mine}
                      className="px-4 py-3 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-xl disabled:opacity-40 hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20"
                    >
                      <Send className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-white/30">
                <div className="text-center flex flex-col items-center gap-4">
                  <div className="relative">
                    <MessageCircle className="h-20 w-20 opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-violet-600 dark:text-violet-400/30" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-500 dark:text-white/40">Выберите чат</p>
                    <p className="text-xs text-gray-500 dark:text-white/20 mt-1">Начните общение с пользователем</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </AdminShell>
  );
}

export default SupportChatsPage;