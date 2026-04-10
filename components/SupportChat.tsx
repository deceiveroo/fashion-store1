'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageCircle, Bot, User, Shield, Headset, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'admin';
  timestamp: Date;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('chat_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('chat_session_id', id);
  }
  return id;
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [unread, setUnread] = useState(0);
  const sessionId = useRef(getSessionId());
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const knownIds = useRef(new Set<string>());
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // SSE stream — receives messages in real time
  useEffect(() => {
    if (!sessionId.current) return;

    const es = new EventSource(`/api/chat/stream?sessionId=${sessionId.current}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const msgs: any[] = data.messages || [];
        if (!msgs.length) return;

        const incoming: Message[] = [];
        for (const m of msgs) {
          if (knownIds.current.has(m.id)) continue;
          knownIds.current.add(m.id);
          // Only show ai/admin messages via SSE (user messages added optimistically)
          if (m.sender === 'ai' || m.sender === 'admin') {
            incoming.push({
              id: m.id,
              text: m.message,
              sender: m.sender,
              timestamp: new Date(m.createdAt),
            });
            if (m.sender === 'admin') setTakenOver(true);
          }
        }

        if (incoming.length > 0) {
          setMessages(prev => [...prev, ...incoming]);
          setLoading(false);
          clearTimeout(loadingTimer.current);
          if (!open) setUnread(n => n + incoming.length);
        }
      } catch {}
    };

    es.onerror = () => setLoading(false);

    return () => es.close();
  }, []); // mount once

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Optimistic user message
    const localId = `local-${Date.now()}`;
    knownIds.current.add(localId);
    setMessages(prev => [...prev, { id: localId, text: trimmed, sender: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => setLoading(false), 15_000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId: sessionId.current }),
      });
      const data = await res.json();

      if (data.takenOver) {
        setTakenOver(true);
        setLoading(false);
        clearTimeout(loadingTimer.current);
      }
      // AI reply comes via SSE
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, text: 'Ошибка соединения. Попробуйте снова.',
        sender: 'ai', timestamp: new Date(),
      }]);
      setLoading(false);
      clearTimeout(loadingTimer.current);
    }
  }, [loading]);

  const callOperator = async () => {
    if (takenOver) return;
    setTakenOver(true);
    setMessages(prev => [...prev, {
      id: `op-${Date.now()}`,
      text: 'Запрос передан оператору. Ожидайте ответа...',
      sender: 'ai', timestamp: new Date(),
    }]);
    try {
      const lastUser = [...messages].reverse().find(m => m.sender === 'user');
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, userMessage: lastUser?.text || 'Запрос оператора' }),
      });
    } catch {}
  };

  // Show welcome message on first open
  const initialized = useRef(false);
  useEffect(() => {
    if (open && !initialized.current && messages.length === 0) {
      initialized.current = true;
      const welcomeId = 'welcome-0';
      if (!knownIds.current.has(welcomeId)) {
        knownIds.current.add(welcomeId);
        setMessages([{
          id: welcomeId,
          text: 'Привет! Я AI-ассистент ELEVATE. Чем могу помочь?\n\nМогу рассказать о доставке, возврате, размерах и оплате.',
          sender: 'ai',
          timestamp: new Date(),
        }]);
      }
    }
  }, [open]);

  return (
    <>
      {/* Bubble button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-violet-500/50 active:scale-95"
          aria-label="Открыть чат"
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0a0a14] sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[380px] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-white/5 bg-[#0f0f1a] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Поддержка</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-white/40">{takenOver ? 'Оператор подключён' : 'Онлайн'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                  msg.sender === 'user' ? 'bg-violet-600' :
                  msg.sender === 'admin' ? 'bg-emerald-600' : 'bg-white/10'
                }`}>
                  {msg.sender === 'user' ? <User className="h-3.5 w-3.5 text-white" /> :
                   msg.sender === 'admin' ? <Shield className="h-3.5 w-3.5 text-white" /> :
                   <Bot className="h-3.5 w-3.5 text-white/60" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  msg.sender === 'user'
                    ? 'rounded-tr-sm bg-violet-600 text-white'
                    : msg.sender === 'admin'
                    ? 'rounded-tl-sm bg-emerald-600/20 border border-emerald-500/20 text-emerald-300'
                    : 'rounded-tl-sm bg-white/5 border border-white/5 text-white/80'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className={`mt-1 text-[10px] ${msg.sender === 'user' ? 'text-white/50' : 'text-white/25'}`}>
                    {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'admin' && ' · Оператор'}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  <Bot className="h-3.5 w-3.5 text-white/60" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-3">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/30 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Call operator */}
          <div className="flex-shrink-0 border-t border-white/5 px-4 py-2">
            <button onClick={callOperator} disabled={takenOver}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs text-white/30 transition-colors hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed">
              <Headset className="h-3.5 w-3.5" />
              {takenOver ? 'Оператор подключён' : 'Позвать оператора'}
            </button>
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-white/5 bg-[#0f0f1a] p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Напишите сообщение..."
                disabled={loading}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
