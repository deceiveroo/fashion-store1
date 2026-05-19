'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, MessageCircle, Search, ChevronDown, Package, CreditCard, HelpCircle,
  Check, CheckCheck, Loader, ArrowLeft, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { AUTO_RESPONSES } from '@/lib/chat-auto-responses';
import { supabase } from '@/lib/supabase-client';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  sender: 'user' | 'ai' | 'admin';
  timestamp: Date;
  read?: boolean;
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

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('chat_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('chat_session_id', id);
  }
  return id;
}

export default function SupportChatMinimalist() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [sessionId] = useState(() => getSessionId());
  const [typing, setTyping] = useState(false);
  const [view, setView] = useState<'search' | 'chat'>('search'); // search or chat view
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false); // Track cart state
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const realtimeChannelRef = useRef<any>(null);

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
      loadMessages();
      subscribeToRealtime();
    } else {
      unsubscribeFromRealtime();
    }
    return () => unsubscribeFromRealtime();
  }, [isOpen, view, sessionId]);

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
            sender:
              m.sender === 'admin' ? 'admin' : m.sender === 'user' ? 'user' : 'ai',
            timestamp: new Date(m.createdAt || m.created_at),
            read: m.isRead ?? m.read_by_admin ?? m.readByAdmin ?? false,
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

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
          
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            
            return [...prev, {
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
              read: newMsg.read_by_admin,
            }];
          });

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
    }
  };

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
        body: JSON.stringify({ message: text, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Send failed');
      }

      const data = await res.json();
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

      await loadMessages();
      setTyping(false);
      setLoading(false);
      return;
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

  const handleQuestionClick = (question: string) => {
    setView('chat');
    send(question);
  };

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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50 transition-all duration-300 ${
          isCartOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 pointer-events-auto scale-100'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            data-chat-panel
            className="fixed bottom-24 right-6 w-[380px] max-h-[600px] bg-[#1A1A2E]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-[90]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#9D4EDD]/20 to-[#FF6B9D]/20 border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1A1A2E]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">ELEVATE Help</h3>
                    <p className="text-white/60 text-xs">Онлайн</p>
                  </div>
                </div>
                {view === 'chat' && (
                  <button
                    onClick={() => setView('search')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white/70" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="bg-[#1A1A2E] max-h-[480px] overflow-y-auto">
              {view === 'search' ? (
                <div className="p-4 space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for help..."
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#9D4EDD]/50 focus:border-[#9D4EDD]/50 transition-all text-sm"
                    />
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    {filteredCategories.map((category) => {
                      const Icon = category.icon;
                      const isExpanded = expandedCategory === category.id;
                      
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-white font-medium text-sm">{category.title}</span>
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-white/40" />
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
                                <div className="px-4 pb-4 space-y-2">
                                  {category.questions.map((question, idx) => (
                                    <motion.button
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      onClick={() => handleQuestionClick(question)}
                                      className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white text-sm transition-all flex items-center gap-2 group"
                                    >
                                      <div className="w-1.5 h-1.5 bg-[#9D4EDD] rounded-full group-hover:scale-125 transition-transform" />
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

                  {/* Start Chat Button */}
                  {!searchQuery && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('chat')}
                      className="w-full py-3.5 bg-gradient-to-r from-[#9D4EDD] to-[#FF6B9D] rounded-2xl text-white font-medium text-sm hover:shadow-lg hover:shadow-[#9D4EDD]/25 transition-all"
                    >
                      Начать чат с оператором
                    </motion.button>
                  )}
                </div>
              ) : (
                // Chat View
                <div className="p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#9D4EDD] to-[#FF6B9D] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-white/60 text-sm">Начните диалог...</p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-[#9D4EDD] to-[#FF6B9D] text-white'
                            : 'bg-white/10 text-white/90 border border-white/10'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text.replace(/\*\*/g, '').replace(/\*/g, '')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs ${msg.sender === 'user' ? 'text-white/70' : 'text-white/40'}`}>
                            {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.sender === 'user' && (
                            msg.read ? <CheckCheck size={14} className="text-white/70" /> : <Check size={14} className="text-white/70" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {typing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                              className="w-2 h-2 bg-[#9D4EDD] rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input Area (only in chat view) */}
            {view === 'chat' && (
              <div className="bg-[#1A1A2E] border-t border-white/10 p-4">
                <div className="flex gap-2">
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
                    placeholder="Напишите сообщение..."
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#9D4EDD]/50 disabled:opacity-50 text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    className="px-4 py-3 bg-gradient-to-r from-[#9D4EDD] to-[#FF6B9D] text-white rounded-xl hover:shadow-lg hover:shadow-[#9D4EDD]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
