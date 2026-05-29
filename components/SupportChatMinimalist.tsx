'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, MessageCircle, Search, ChevronDown, Package, CreditCard, HelpCircle,
  Check, CheckCheck, Loader, ArrowLeft, Sparkles, User, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { AUTO_RESPONSES, searchFaq, type FaqEntry } from '@/lib/chat-auto-responses';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  sender: 'user' | 'ai' | 'admin';
  timestamp: Date;
  read?: boolean;
  readByAdmin?: boolean; // Добавлено для отслеживания прочтения админом
}

const CATEGORIES = [
  {
    id: 'orders',
    title: 'Заказы',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    questions: ['Где мой заказ?', 'Как отменить заказ?', 'Изменить адрес доставки']
  },
  {
    id: 'payment',
    title: 'Оплата',
    icon: CreditCard,
    color: 'from-purple-500 to-pink-500',
    questions: ['Способы оплаты', 'Проблемы с оплатой', 'Возврат средств']
  },
  {
    id: 'returns',
    title: 'Возвраты',
    icon: HelpCircle,
    color: 'from-orange-500 to-red-500',
    questions: ['Как вернуть товар?', 'Сроки возврата', 'Условия обмена']
  }
];

function clearLegacyChatStorage() {
  // Old versions of the app stored a chat session id in localStorage. That's a
  // privacy leak (two users sharing a browser inherit each other's chat). Wipe it
  // once on mount; the server now hands us the correct sessionId via cookie.
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('chat_session_id');
  } catch {}
}

export default function SupportChatMinimalist() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [typing, setTyping] = useState(false);
  const [view, setView] = useState<'search' | 'chat'>('search'); // search or chat view
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null); // раскрытый ответ в результатах поиска
  const [isCartOpen, setIsCartOpen] = useState(false); // Track cart state
  const [adminInfo, setAdminInfo] = useState<{ name: string | null; avatar: string | null; email: string | null } | null>(null);
  // Состояние оценки оператора после завершения диалога админом.
  const [sessionStatus, setSessionStatus] = useState<'active' | 'resolved' | 'archived'>('active');
  const [operatorRating, setOperatorRating] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const realtimeChannelRef = useRef<any>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Wipe legacy localStorage key once.
  useEffect(() => { clearLegacyChatStorage(); }, []);

  // When the auth identity changes (login / logout / switching account),
  // throw away the previous sessionId, conversation state and admin info.
  // The next loadMessages() call will fetch the correct identity from the server.
  useEffect(() => {
    setSessionId('');
    setMessages([]);
    setAdminInfo(null);
    setTakenOver(false);
    setSessionStatus('active');
    setOperatorRating(null);
    setRatingValue(0);
    unsubscribeFromRealtime();
  }, [user?.id]);

  // Listen for cart state changes
  useEffect(() => {
    const handleCartStateChange = (e: CustomEvent) => {
      setIsCartOpen(e.detail.isOpen);
      // Close chat when cart opens
      if (e.detail.isOpen && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('cartStateChange', handleCartStateChange as EventListener);
    return () => window.removeEventListener('cartStateChange', handleCartStateChange as EventListener);
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && view === 'chat') {
      inputRef.current?.focus();
      // Sequentially: load messages (server returns the canonical sessionId),
      // then subscribe to realtime for that sessionId.
      (async () => {
        const sid = await loadMessages();
        if (sid) {
          subscribeToRealtime(sid);

          try {
            await fetch('/api/chat/mark-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sid }),
            });
          } catch (err) {
            console.error('Failed to mark messages as read:', err);
          }
        }
      })();
    } else {
      unsubscribeFromRealtime();
    }
    return () => unsubscribeFromRealtime();
  }, [isOpen, view, user?.id]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the chat panel
      if (!target.closest('[data-chat-panel]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Returns the sessionId the server used so the caller can subscribe with it.
  const loadMessages = async (): Promise<string> => {
    try {
      const res = await fetch(`/api/chat`, { credentials: 'include' });
      if (!res.ok) return '';
      const data = await res.json();
      const serverSid: string = data.sessionId || '';
      if (serverSid && serverSid !== sessionIdRef.current) {
        setSessionId(serverSid);
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          text: m.message,
          imageUrl: m.imageUrl || m.image_url,
          sender:
            m.sender === 'admin' ? 'admin' : m.sender === 'user' ? 'user' : 'ai',
          timestamp: new Date(m.createdAt || m.created_at),
          read: m.isRead ?? false,
          readByAdmin: m.read_by_admin ?? m.readByAdmin ?? false,
        })));
      } else {
        setMessages([]);
      }
      if (data.adminInfo) {
        setAdminInfo(data.adminInfo);
      }
      if (data.takenOver) setTakenOver(true);
      if (data.status) setSessionStatus(data.status);
      if (typeof data.operatorRating === 'number') setOperatorRating(data.operatorRating);
      return serverSid;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return '';
    }
  };

  const subscribeToRealtime = (sid: string) => {
    if (!sid) return;
    // If we're already subscribed to the right session, keep it. Otherwise drop and resubscribe.
    if (realtimeChannelRef.current && realtimeChannelRef.current.__sid === sid) return;
    if (realtimeChannelRef.current) {
      try { supabase.removeChannel(realtimeChannelRef.current); } catch {}
      realtimeChannelRef.current = null;
    }

    const channelName = `chat-${sid}`;
    const channel: any = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_chat_messages',
        filter: `session_id=eq.${sid}`,
      },
      (payload: any) => {
        // Defensive guard: if the user logged in/out between subscribe and callback,
        // the active sessionId may have changed. Drop stragglers from the old session.
        if (sessionIdRef.current && sessionIdRef.current !== sid) return;
        const newMsg = payload.new as any;
        // Extra defensive: server-side filter should already match, but double-check.
        if (newMsg.session_id && newMsg.session_id !== sid) return;

        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id);
          if (exists) return prev;

          const isUserMessage = newMsg.sender === 'user';
          let filtered = prev;
          if (isUserMessage) {
            filtered = prev.filter(m => !(m.sender === 'user' && m.id.startsWith('temp-')));
          }

          return [...filtered, {
            id: newMsg.id,
            text: newMsg.message,
            imageUrl: newMsg.image_url,
            sender:
              newMsg.sender === 'admin'
                ? 'admin'
                : newMsg.sender === 'user'
                  ? 'user'
                  : 'ai',
            timestamp: new Date(newMsg.created_at),
            read: newMsg.is_read ?? false,
            readByAdmin: newMsg.read_by_admin ?? false,
          }];
        });

        if (newMsg.sender === 'admin') {
          setTakenOver(true);
          if (!adminInfo) {
            fetch(`/api/chat`, { credentials: 'include' })
              .then(res => res.json())
              .then(data => {
                if (data.adminInfo) setAdminInfo(data.adminInfo);
              })
              .catch(err => console.error('Failed to load admin info:', err));
          }
        }
      }
    );

    // Слушаем смену статуса сессии: когда админ завершает диалог
    // (status -> 'resolved'), показываем пользователю запрос оценки оператора.
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_chat_sessions',
        filter: `session_id=eq.${sid}`,
      },
      (payload: any) => {
        if (sessionIdRef.current && sessionIdRef.current !== sid) return;
        const row = payload.new as any;
        if (row.status) setSessionStatus(row.status);
        if (typeof row.operator_rating === 'number') setOperatorRating(row.operator_rating);
        if (row.ai_disabled) setTakenOver(true);
      }
    );

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connected for chat:', sid);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime channel error:', sid);
      } else if (status === 'TIMED_OUT') {
        console.warn('⚠️ Realtime channel timed out:', sid);
      }
    });

    channel.__sid = sid;
    realtimeChannelRef.current = channel;
  };

  function unsubscribeFromRealtime() {
    if (realtimeChannelRef.current) {
      try { supabase.removeChannel(realtimeChannelRef.current); } catch {}
      realtimeChannelRef.current = null;
    }
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Send failed');
      }

      const data = await res.json();

      // First write — server may have just minted our sessionId. Subscribe now.
      if (data.sessionId && data.sessionId !== sessionIdRef.current) {
        setSessionId(data.sessionId);
        subscribeToRealtime(data.sessionId);
      }

      const operatorActive = Boolean(data.takenOver);
      if (operatorActive) setTakenOver(true);

      if (data.autoReply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            text: data.autoReply,
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      } else if (!operatorActive) {
        setTyping(true);
        await new Promise((r) => setTimeout(r, 600));
      }

      // НЕ вызываем loadMessages() сразу - realtime добавит сообщение автоматически
      // Но если realtime не сработает в течение 5 секунд, загрузим вручную
      setTimeout(async () => {
        console.log('⚠️ Realtime timeout, loading messages manually...');
        await loadMessages();
      }, 5000);
      setTyping(false);
      setLoading(false);
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Не удалось отправить сообщение');
      setLoading(false);
      setTyping(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Оценка оператора после завершения диалога. Звёзды 1-5 переводим в шкалу
  // 1-10, в которой админка хранит operator_rating.
  const submitRating = async (stars: number) => {
    if (stars < 1 || ratingSubmitting) return;
    setRatingSubmitting(true);
    setRatingValue(stars);
    try {
      const res = await fetch('/api/chat/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating: stars * 2 }),
      });
      if (!res.ok) throw new Error('rating failed');
      setOperatorRating(stars * 2);
      toast.success('Спасибо за оценку!');
    } catch (err) {
      console.error('Rating error:', err);
      toast.error('Не удалось отправить оценку');
      setRatingValue(0);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    setView('chat');
    send(question);
  };

  // Умный поиск по всей базе FAQ (с опечатками). Пусто при пустом запросе.
  const faqResults = searchQuery.trim() ? searchFaq(searchQuery, 6) : [];

  // Очистка markdown-звёздочек для отображения ответа в карточке.
  const cleanText = (t: string) => t.replace(/\*\*/g, '').replace(/\*/g, '');

  const filteredCategories = searchQuery.trim()
    ? CATEGORIES.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.questions.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : CATEGORIES;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат поддержки'}
        className={`group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
          isCartOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 pointer-events-auto'
        }`}
      >
        {/* Pulsing halo */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] opacity-60 blur-md animate-pulse" />
        )}
        <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] shadow-[0_8px_30px_rgba(157,78,221,0.45)] ring-1 ring-white/20">
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="h-5 w-5 text-white" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle className="h-5 w-5 text-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            data-chat-panel
            className="fixed bottom-20 right-4 sm:right-5 z-[90] flex h-[540px] max-h-[calc(100vh-6.5rem)] w-[calc(100vw-2rem)] sm:w-[360px] flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#1e1e2e] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)]"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D]" />
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center justify-between p-3.5 text-white">
                <div className="flex items-center gap-2.5">
                  {view === 'chat' && (
                    <button
                      onClick={() => setView('search')}
                      aria-label="Назад"
                      className="-ml-1 rounded-full p-1.5 transition-colors hover:bg-white/15"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                      {takenOver && adminInfo?.avatar ? (
                        <img src={adminInfo.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-[#b052cc]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  </div>
                  <div className="leading-tight">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {takenOver ? adminInfo?.name || 'Оператор' : 'ELEVATE Help'}
                    </h3>
                    <p className="flex items-center gap-1.5 text-[11px] text-white/75">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      {takenOver ? 'Оператор на связи' : 'Обычно отвечаем сразу'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Закрыть"
                  className="rounded-full p-2 transition-colors hover:bg-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-50 to-white dark:from-[#22223a] dark:to-[#1a1a28]">
              {view === 'search' ? (
                <div className="space-y-5 p-4">
                  {/* Greeting */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#9D4EDD]/[0.08] to-[#FF6B9D]/[0.08] p-4 dark:from-[#9D4EDD]/[0.12] dark:to-[#FF6B9D]/[0.12]">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Привет{user?.name ? `, ${user.name}` : ''} 👋
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-white/60">
                      Чем можем помочь? Выберите тему или начните диалог с оператором.
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setOpenFaqId(null); }}
                      placeholder="Опишите вопрос: доставка, возврат, баг…"
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-[#9D4EDD]/50 focus:outline-none focus:ring-2 focus:ring-[#9D4EDD]/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-white/40"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); setOpenFaqId(null); }}
                        aria-label="Очистить"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Результаты умного поиска */}
                  {searchQuery.trim() && (
                    <div className="space-y-2">
                      {faqResults.length > 0 ? (
                        <>
                          <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-white/40">
                            Возможно, это поможет
                          </p>
                          {faqResults.map((faq: FaqEntry) => {
                            const isOpen = openFaqId === faq.id;
                            return (
                              <motion.div
                                key={faq.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                              >
                                <button
                                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                  <span className="flex items-center gap-2.5 text-sm font-medium text-gray-900 dark:text-white">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9D4EDD]/10 text-[#9D4EDD] dark:bg-[#9D4EDD]/20 dark:text-violet-300">
                                      <HelpCircle className="h-4 w-4" />
                                    </span>
                                    {faq.title}
                                  </span>
                                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-white/40" />
                                  </motion.div>
                                </button>
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3.5 pb-3.5">
                                        <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-[13px] leading-relaxed text-gray-700 dark:bg-white/[0.04] dark:text-white/80">
                                          {cleanText(faq.response)}
                                        </p>
                                        <button
                                          onClick={() => handleQuestionClick(faq.title)}
                                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#9D4EDD]/30 py-2 text-xs font-medium text-[#9D4EDD] transition-colors hover:bg-[#9D4EDD]/10 dark:text-violet-300"
                                        >
                                          <MessageCircle className="h-3.5 w-3.5" />
                                          Задать оператору
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                          {/* Если ничего не подошло — отправить вопрос оператору */}
                          <button
                            onClick={() => handleQuestionClick(searchQuery)}
                            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9D4EDD] to-[#FF6B9D] py-3 text-sm font-semibold text-white shadow-lg shadow-[#9D4EDD]/25 transition-all hover:shadow-xl"
                          >
                            <Send className="h-4 w-4" />
                            Спросить «{searchQuery.length > 22 ? searchQuery.slice(0, 22) + '…' : searchQuery}»
                          </button>
                        </>
                      ) : (
                        // Ничего не найдено — сразу предлагаем оператора
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center dark:border-white/15 dark:bg-white/[0.03]">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D]">
                            <Sparkles className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Ничего не нашли по запросу</p>
                          <p className="mx-auto mt-1 mb-3 max-w-[240px] text-xs leading-relaxed text-gray-500 dark:text-white/50">
                            Опишите вопрос оператору — поможем разобраться.
                          </p>
                          <button
                            onClick={() => handleQuestionClick(searchQuery)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#9D4EDD] to-[#FF6B9D] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#9D4EDD]/25 transition-all hover:shadow-xl"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Написать оператору
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Categories (только когда нет активного поиска) */}
                  {!searchQuery.trim() && (
                  <div className="space-y-2.5">
                    {filteredCategories.map((category) => {
                      const Icon = category.icon;
                      const isExpanded = expandedCategory === category.id;

                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors dark:border-white/10 dark:bg-white/[0.03]"
                        >
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className="flex w-full items-center justify-between p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-sm`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{category.title}</span>
                            </div>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="h-5 w-5 text-gray-400 dark:text-white/40" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-1.5 px-3 pb-3">
                                  {category.questions.map((question, idx) => (
                                    <motion.button
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      onClick={() => handleQuestionClick(question)}
                                      className="group flex w-full items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5 text-left text-sm text-gray-700 transition-all hover:bg-[#9D4EDD]/[0.08] hover:text-gray-900 dark:bg-white/[0.04] dark:text-white/80 dark:hover:bg-white/[0.08] dark:hover:text-white"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#9D4EDD] transition-transform group-hover:scale-150" />
                                      {question}
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                  )}

                  {/* Start Chat Button */}
                  {!searchQuery && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('chat')}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9D4EDD] to-[#FF6B9D] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#9D4EDD]/25 transition-all hover:shadow-xl hover:shadow-[#9D4EDD]/35"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Начать чат с оператором
                    </motion.button>
                  )}
                </div>
              ) : (
                // Chat View
                <div className="space-y-4 p-4">
                  {messages.length === 0 && (
                    <div className="py-10 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] shadow-lg shadow-[#9D4EDD]/30">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Начните диалог</p>
                      <p className="mx-auto mt-1 max-w-[220px] text-xs leading-relaxed text-gray-500 dark:text-white/50">
                        Напишите вопрос — ответим в ближайшее время.
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const isAdmin = msg.sender === 'admin';
                    const userAvatar = user?.avatar || user?.image;
                    const adminDisplayName = adminInfo?.name || 'Администратор';
                    const adminAvatarUrl = adminInfo?.avatar;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Avatar - left for AI/admin */}
                        {!isUser && (
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10">
                            {isAdmin && adminAvatarUrl ? (
                              <img src={adminAvatarUrl} alt={adminDisplayName} className="h-full w-full object-cover" />
                            ) : isAdmin ? (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D]">
                                <Sparkles className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? 'rounded-[1.25rem] rounded-br-md bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] text-white shadow-md shadow-[#9D4EDD]/20'
                              : 'rounded-[1.25rem] rounded-bl-md border border-gray-200 bg-white text-gray-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/90'
                          }`}
                        >
                          {!isUser && (
                            <p className={`mb-0.5 text-[11px] font-semibold ${isAdmin ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#9D4EDD] dark:text-violet-400'}`}>
                              {isAdmin ? adminDisplayName : 'ELEVATE AI'}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
                          <div className={`mt-1.5 flex items-center gap-1.5 ${isUser ? 'justify-end' : ''}`}>
                            <span className={`text-[10px] ${isUser ? 'text-white/70' : 'text-gray-400 dark:text-white/40'}`}>
                              {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isUser && (msg.readByAdmin ? (
                              <CheckCheck size={13} className="text-emerald-200" />
                            ) : msg.read ? (
                              <Check size={13} className="text-white/70" />
                            ) : null)}
                          </div>
                        </div>

                        {/* User Avatar - right side */}
                        {isUser && (
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10">
                            {userAvatar ? (
                              <img src={userAvatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D]">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {typing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D]">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-[1.25rem] rounded-bl-md border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                              className="h-2 w-2 rounded-full bg-[#9D4EDD]"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Запрос оценки оператора после завершения диалога */}
                  {sessionStatus === 'resolved' && takenOver && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-[#9D4EDD]/20 bg-gradient-to-br from-[#9D4EDD]/[0.06] to-[#FF6B9D]/[0.06] p-4 text-center dark:border-white/10 dark:from-[#9D4EDD]/[0.12] dark:to-[#FF6B9D]/[0.12]"
                    >
                      {operatorRating ? (
                        <>
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D]">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Спасибо за оценку!</p>
                          <div className="mt-2 flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-5 w-5 ${s <= Math.round(operatorRating / 2) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-white/20'}`}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Оцените работу оператора</p>
                          <p className="mx-auto mt-1 mb-3 max-w-[240px] text-xs leading-relaxed text-gray-500 dark:text-white/50">
                            Ваш отзыв помогает нам стать лучше
                          </p>
                          <div className="flex justify-center gap-1.5" onMouseLeave={() => setRatingHover(0)}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={ratingSubmitting}
                                onMouseEnter={() => setRatingHover(s)}
                                onClick={() => submitRating(s)}
                                aria-label={`Оценка ${s}`}
                                className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                              >
                                <Star
                                  className={`h-8 w-8 transition-colors ${
                                    s <= (ratingHover || ratingValue)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-300 dark:text-white/20'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input Area (only in chat view) */}
            {view === 'chat' && (
              <div className="shrink-0 border-t border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#1e1e2e]">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 pl-4 transition-colors focus-within:border-[#9D4EDD]/50 focus-within:ring-2 focus-within:ring-[#9D4EDD]/20 dark:border-white/10 dark:bg-white/5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="Напишите сообщение…"
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-50 dark:text-white dark:placeholder-white/40"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    aria-label="Отправить"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] text-white shadow-md shadow-[#9D4EDD]/25 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
