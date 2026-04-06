'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Sparkles, Bot, User, Shield, Headset, Paperclip, Image as ImageIcon, Upload, Star } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  sender: 'user' | 'ai' | 'admin';
  timestamp: Date;
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

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'Привет!  Я AI-ассистент ELEVATE. Чем могу помочь?', sender: 'ai', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [sessionId] = useState(() => getSessionId());
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const knownIds = useRef<Set<string>>(new Set(['0']));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  // Connect SSE when chat opens
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const es = new EventSource(`/api/chat/stream?sessionId=${sessionId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const msgs: any[] = data.type === 'init' ? data.messages : data.messages;
        if (!msgs?.length) return;

        const newMsgs: Message[] = [];
        for (const m of msgs) {
          if (knownIds.current.has(m.id)) continue;
          knownIds.current.add(m.id);
          // Only show ai and admin messages from server (user messages already shown locally)
          if (m.sender === 'ai' || m.sender === 'admin') {
            newMsgs.push({ 
              id: m.id, 
              text: m.message, 
              imageUrl: m.imageUrl, 
              sender: m.sender, 
              timestamp: new Date(m.createdAt) 
            });
            if (m.sender === 'admin') setTakenOver(false);
          }
        }
        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs]);
          setLoading(false);
        }
      } catch {}
    };

    es.onerror = () => {};

    return () => { es.close(); esRef.current = null; };
  }, [isOpen, sessionId]);

  const send = async (text: string, imageUrl: string | null = null) => {
    if ((!text.trim() && !imageUrl) || loading) return;
    
    const userMsg: Message = { 
      id: `local-${Date.now()}`, 
      text, 
      imageUrl: imageUrl || undefined,
      sender: 'user', 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, imageUrl, sessionId }),
      });
      const d = await r.json();
      if (d.takenOver) {
        setTakenOver(true);
        // Show waiting message
        const waitMsg: Message = { id: `wait-${Date.now()}`, text: d.message, sender: 'ai', timestamp: new Date() };
        setMessages(prev => [...prev, waitMsg]);
        setLoading(false);
      }
      // AI response will come via SSE stream
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, text: 'Ошибка соединения. Попробуйте снова.', sender: 'ai', timestamp: new Date() }]);
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        send(input, event.target.result.toString());
        setInput('');
      }
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitRating = async () => {
    if (rating < 1 || rating > 10) return;
    
    setSubmittingRating(true);
    
    try {
      const response = await fetch('/api/chat/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, rating }),
      });
      
      if (response.ok) {
        setShowRating(false);
        setRating(0);
        // Confirm rating was submitted
        setMessages(prev => [...prev, { 
          id: `rating-${Date.now()}`, 
          text: 'Спасибо за вашу оценку!', 
          sender: 'ai', 
          timestamp: new Date() 
        }]);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const callOperator = async () => {
    setTakenOver(true);
    const msg: Message = { id: `op-${Date.now()}`, text: ' Запрос передан оператору. Ожидайте...', sender: 'ai', timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    try {
      const lastUser = messages.filter(m => m.sender === 'user').slice(-1)[0];
      await fetch('/api/telegram/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage: lastUser?.text || 'Запрос оператора', userName: null, userEmail: null }),
      });
    } catch {}
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 transition-shadow"
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              <MessageCircle className="w-7 h-7 text-white" />
            </motion.div>
            <motion.div className="absolute inset-0 rounded-full bg-purple-600"
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-[600px] bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold">AI Поддержка</h3>
                  <div className="flex items-center gap-1">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-white/80 text-xs">{takenOver ? 'Оператор' : 'Онлайн'}</span>
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              {messages.map((msg, i) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i < 3 ? 0 : 0.05 }}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : msg.sender === 'admin' ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4 text-white" />
                    : msg.sender === 'admin' ? <Shield className="w-4 h-4 text-white" />
                    : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`max-w-[70%] rounded-2xl p-3 ${
                    msg.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : msg.sender === 'admin' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={msg.imageUrl} 
                          alt="Attached" 
                          className="max-w-full max-h-40 rounded-lg object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <span className={`text-xs mt-1 block ${msg.sender !== 'user' && msg.sender !== 'admin' ? 'text-gray-500' : 'text-white/70'}`}>
                      {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender === 'admin' && '  Оператор'}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {/* Rating Interface */}
              {showRating && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                  <p className="mb-3 text-center text-gray-700 dark:text-gray-300">
                    Как вы оцените помощь оператора по шкале от 1 до 10?
                  </p>
                  <div className="flex mb-3">
                    {[...Array(10)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 mx-0.5 cursor-pointer ${
                          i < rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        onClick={() => setRating(i + 1)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={submitRating}
                      disabled={submittingRating}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {submittingRating ? 'Отправка...' : 'Отправить'}
                    </button>
                    <button
                      onClick={() => setShowRating(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
                    >
                      Отмена
                    </button>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 bg-purple-500 rounded-full" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>

            {/* Operator button */}
            <div className="px-4 pt-2 bg-white dark:bg-gray-900 flex-shrink-0">
              <button onClick={callOperator} disabled={takenOver}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-purple-600 disabled:opacity-40 transition-colors">
                <Headset className="w-4 h-4" />
                {takenOver ? 'Оператор подключён' : 'Позвать оператора'}
              </button>
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex gap-2">
                <input 
                  ref={inputRef} 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      send(input); 
                    } 
                  }}
                  placeholder="Напишите сообщение..." 
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white placeholder-gray-500 disabled:opacity-50 text-sm"
                />
                
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
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Прикрепить изображение"
                >
                  <Upload className="w-5 h-5" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => send(input)} 
                  disabled={!input.trim() || loading}
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}