'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, MessageCircle, Sparkles, Bot, User, Shield, 
  Headset, Search, ChevronDown, Package, CreditCard, HelpCircle,
  Check, CheckCheck, Loader, ArrowLeft, Grid, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { findAutoResponse, AUTO_RESPONSES } from '@/lib/chat-auto-responses';
import { supabase } from '@/lib/supabase-client';
import { TypingIndicatorManager } from '@/lib/typing-indicator';
import { getOfflineQueue } from '@/lib/offline-queue';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  sender: 'user' | 'ai' | 'admin';
  timestamp: Date;
  read?: boolean;
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('chat_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('chat_session_id', id);
  }
  return id;
}

export default function SupportChatNew() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [sessionId] = useState(() => getSessionId());
  const [typing, setTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(true); // Показывать поиск вместо чата
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [adminTyping, setAdminTyping] = useState(false); // Админ печатает
  const typingManagerRef = useRef<TypingIndicatorManager | null>(null);
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      loadMessages();
      subscribeToRealtime();
      
      // Инициализируем typing indicator
      typingManagerRef.current = new TypingIndicatorManager(sessionId, 'user');
      typingManagerRef.current.initialize(supabase, (userId, isTyping) => {
        setAdminTyping(isTyping);
      });

      // Инициализируем offline queue
      const queue = getOfflineQueue();
      queue.init().then(() => {
        queue.setupNetworkListener();
        updateOfflineQueueSize();
      });

      // Слушатели статуса сети
      const handleOnline = () => {
        setIsOnline(true);
        updateOfflineQueueSize();
      };
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

    } else {
      unsubscribeFromRealtime();
      typingManagerRef.current?.cleanup();
    }
    return () => {
      unsubscribeFromRealtime();
      typingManagerRef.current?.cleanup();
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, [isOpen, sessionId]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            text: m.message,
            imageUrl: m.imageUrl || m.image_url,
            sender: m.sender === 'admin' ? 'admin' : 'ai',
            timestamp: new Date(m.createdAt || m.created_at),
            read: m.readByAdmin || m.read_by_admin,
          })));
        } else {
          // Приветственное сообщение
          setMessages([{
            id: '0',
            text: '👋 Здравствуйте! Добро пожаловать в ELEVATE!\n\nЯ помогу вам с:\n• Информацией о доставке\n• Вопросами по товарам\n• Оформлением заказа\n• Возвратами и обменом\n\nОпишите ваш вопрос, и я постараюсь помочь!',
            sender: 'ai',
            timestamp: new Date(),
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Обновить размер offline очереди
  const updateOfflineQueueSize = async () => {
    const queue = getOfflineQueue();
    const size = await queue.getQueueSize(sessionId);
    setOfflineQueueSize(size);
  };

  // Supabase Realtime подписка на новые сообщения
  const subscribeToRealtime = () => {
    if (realtimeChannelRef.current) return;

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          
          // Проверяем не дубликат ли это
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            
            return [...prev, {
              id: newMsg.id,
              text: newMsg.message,
              imageUrl: newMsg.image_url,
              sender: newMsg.sender === 'admin' ? 'admin' : 'ai',
              timestamp: new Date(newMsg.created_at),
              read: newMsg.read_by_admin,
            }];
          });

          // Проверяем не подключился ли оператор
          if (newMsg.sender === 'admin') {
            setTakenOver(true);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected for chat:', sessionId);
        }
      });

    realtimeChannelRef.current = channel;
  };

  const unsubscribeFromRealtime = () => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
      console.log('❌ Realtime disconnected');
    }
  };

  const send = async (text: string, imageUrl: string | null = null) => {
    if ((!text.trim() && !imageUrl) || loading) return;

    // Если офлайн - добавляем в очередь
    if (!isOnline) {
      const queue = getOfflineQueue();
      await queue.addMessage({
        sessionId,
        text,
        imageUrl,
      });
      
      // Показываем сообщение локально
      const offlineMsg: Message = {
        id: `offline-${Date.now()}`,
        text: text || '📷 Изображение',
        imageUrl: imageUrl || undefined,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, offlineMsg]);
      setInput('');
      
      toast.info('Сообщение сохранено. Отправится при подключении.');
      updateOfflineQueueSize();
      return;
    }

    // Оптимистичный UI - показываем сообщение сразу
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      text: text || '📷 Изображение',
      imageUrl: imageUrl || undefined,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      // Сначала проверяем/создаём сессию
      const { data: existingSession, error: sessionError } = await supabase
        .from('support_chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      // Если таблица не существует - показываем ошибку
      if (sessionError && sessionError.code === '42P01') {
        console.error('❌ Таблица support_chat_sessions не существует!');
        toast.error('База данных не настроена. Выполните миграцию SQL.');
        throw new Error('Database tables not initialized. Please run fix-chat-tables-final.sql in Supabase.');
      }

      if (!existingSession) {
        // Создаём новую сессию
        await supabase.from('support_chat_sessions').insert({
          id: crypto.randomUUID(),
          session_id: sessionId,
          status: 'active',
          message_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Сохраняем в Supabase напрямую
      const { error, data } = await supabase
        .from('support_chat_messages')
        .insert({
          id: crypto.randomUUID(),
          session_id: sessionId,
          message: text || '📷 Изображение',
          image_url: imageUrl,
          sender: 'user',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Обновляем сессию
      await supabase.rpc('update_chat_session', {
        p_session_id: sessionId,
        p_message: text || '📷 Изображение',
      });

      setTyping(false);
      
      // Проверяем подключён ли оператор
      const { data: session } = await supabase
        .from('support_chat_sessions')
        .select('ai_disabled')
        .eq('session_id', sessionId)
        .single();

      if (session?.ai_disabled) {
        setTakenOver(true);
        toast.info('Оператор подключён к чату');
        return;
      }

      // Проверяем авто-ответы
      const autoResponse = findAutoResponse(text);
      
      if (autoResponse) {
        // Используем авто-ответ
        const aiMsg: Message = {
          id: `auto-${Date.now()}`,
          text: autoResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // Сохраняем авто-ответ в БД
        await supabase.from('support_chat_messages').insert({
          id: crypto.randomUUID(),
          session_id: sessionId,
          message: autoResponse,
          sender: 'ai',
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Ошибка отправки сообщения');
      // Откатываем оптимистичное сообщение
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      toast.error('Только изображения');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Максимум 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        send(input, ev.target.result.toString());
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const callOperator = async () => {
    setTakenOver(true);
    toast.info('Запрос передан оператору');
    
    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      text: '⏳ Запрос передан оператору. Ожидайте ответа...',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, systemMsg]);

    try {
      const lastUserMsg = messages.filter(m => m.sender === 'user').slice(-1)[0];
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage: lastUserMsg?.text || 'Запрос оператора',
          userName: null,
          userEmail: null,
        }),
      });
    } catch (error) {
      console.error('Notify error:', error);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            aria-label="Открыть чат поддержки"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 transition-shadow group"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </motion.div>
            
            {/* Pulse animation */}
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-600"
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            
            {/* Notification badge */}
            {messages.length > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
              >
                {messages.filter(m => m.sender !== 'user').length}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Чат поддержки"
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-[100dvh] sm:h-[650px] bg-white dark:bg-gray-900 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-bold text-lg">AI Поддержка</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {/* Online/Offline indicator */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-white/80 text-xs">
                        {isOnline ? 'Онлайн' : 'Офлайн'}
                      </span>
                    </div>
                    
                    {/* Offline queue badge */}
                    {offlineQueueSize > 0 && (
                      <div className="px-2 py-0.5 bg-yellow-500/30 backdrop-blur-sm rounded-full border border-yellow-400/50">
                        <span className="text-white text-xs font-medium">
                          📨 {offlineQueueSize} в очереди
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    <span className="text-white/90 text-sm">
                      {takenOver ? 'Оператор онлайн' : 'AI онлайн'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!takenOver && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={callOperator}
                    aria-label="Позвать оператора"
                    title="Позвать оператора"
                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1"
                  >
                    <Headset className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  aria-label="Закрыть чат"
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900"
              role="log"
              aria-label="Сообщения чата"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i < 3 ? 0 : 0.05 }}
                  className={`flex gap-2 sm:gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : msg.sender === 'admin'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-purple-500 to-pink-600'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : msg.sender === 'admin' ? (
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    role="article"
                    aria-label={`Сообщение от ${msg.sender === 'user' ? 'вас' : msg.sender === 'admin' ? 'оператора' : 'AI ассистента'}`}
                    className={`max-w-[70%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : msg.sender === 'admin'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-md'
                    }`}
                  >
                    {msg.text && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Attached"
                        className="mt-2 max-w-full max-h-48 rounded-lg object-contain"
                      />
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs ${
                          msg.sender === 'user' || msg.sender === 'admin'
                            ? 'text-white/70'
                            : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.sender === 'user' && (
                        <span className="text-white/70">
                          {msg.read ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={endRef} />
            </div>

            {/* Quick Answer Buttons - Only show when operator NOT connected */}
            {!takenOver && (
              <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                {!selectedCategory ? (
                  // Show categories
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <Grid className="w-3 h-3" />
                      Выберите тему вопроса:
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                      {[
                        { id: 'shipping', label: '🚚 Доставка', icon: 'delivery' },
                        { id: 'returns', label: '↩️ Возврат', icon: 'return' },
                        { id: 'payment', label: '💳 Оплата', icon: 'payment' },
                        { id: 'sizes', label: '📏 Размеры', icon: 'size' },
                        { id: 'products', label: '👕 Товары', icon: 'product' },
                        { id: 'orders', label: '🛒 Заказы', icon: 'order' },
                        { id: 'account', label: '👤 Аккаунт', icon: 'account' },
                        { id: 'promotions', label: '🎁 Скидки', icon: 'promo' },
                        { id: 'loyalty', label: '⭐ Бонусы', icon: 'bonus' },
                        { id: 'company', label: '🏢 О нас', icon: 'about' },
                        { id: 'care', label: '🧺 Уход', icon: 'care' },
                        { id: 'technical', label: '🔧 Техподдержка', icon: 'tech' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className="px-3 py-2.5 text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all border border-purple-200 dark:border-purple-800 text-left"
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Show specific questions for selected category
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                      >
                        ← Назад к темам
                      </button>
                      <span className="text-xs text-gray-400 capitalize">{selectedCategory}</span>
                    </div>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {AUTO_RESPONSES.filter(r => r.category === selectedCategory).map((response, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            send(response.keywords[0]); // Send first keyword to trigger response
                          }}
                          className="w-full px-3 py-2.5 text-xs text-left bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 flex items-start gap-2 group"
                        >
                          <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 group-hover:text-purple-500 flex-shrink-0" />
                          <span className="line-clamp-2">{response.response.split('\n')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Area - Only show when operator IS connected */}
            {takenOver && (
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                {/* Typing Indicator */}
                {adminTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-violet-500 rounded-full"
                      />
                    </div>
                    <span>Оператор печатает...</span>
                  </motion.div>
                )}
                
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Отправляем typing статус
                      if (takenOver && typingManagerRef.current) {
                        typingManagerRef.current.notifyTyping();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                      // Escape для закрытия чата
                      if (e.key === 'Escape') {
                        setIsOpen(false);
                      }
                    }}
                    placeholder="Напишите сообщение оператору..."
                    disabled={loading}
                    aria-label="Введите сообщение"
                    aria-describedby="chat-input-help"
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white placeholder-gray-500 disabled:opacity-50 text-sm"
                  />
                  
                  {/* Hidden help text for screen readers */}
                  <div id="chat-input-help" className="sr-only">
                    Нажмите Enter для отправки, Escape для закрытия чата
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                    title="Прикрепить изображение"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
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
