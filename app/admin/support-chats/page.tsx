'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, CheckCircle, Archive, User, Bot, Shield, Trash2, RefreshCw, Zap, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { supabase } from '@/lib/supabase-client';

interface Msg { id: string; sessionId: string; message: string; sender: 'user'|'ai'|'admin'; createdAt: string; }
interface Session { id: string; sessionId: string; userEmail: string|null; userName: string|null; status: 'active'|'resolved'|'archived'; messageCount: number|null; firstMessage: string|null; lastMessageAt: string|null; aiDisabled: boolean|null; createdAt: string; }

function SupportChatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sel, setSel] = useState<Session|null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all'|'active'|'resolved'>('all');
  const endRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<Session|null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const sessionsChannelRef = useRef<any>(null);
  const taken = sel?.aiDisabled === true;

  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const r = await fetch(`/api/admin/support-chats/${encodeURIComponent(sessionId)}`);
      if (!r.ok) return;
      const d = await r.json();
      const list: Msg[] = (d.messages || []).map((m: Record<string, unknown>) => ({
        id: String(m.id),
        sessionId: String(m.sessionId ?? m.session_id ?? sessionId),
        message: String(m.message ?? ''),
        sender: (m.sender as Msg['sender']) ?? 'user',
        createdAt: String(m.createdAt ?? m.created_at ?? new Date().toISOString()),
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
    loadMessages(sel.sessionId);
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
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    if (!sel) { setMessages([]); return; }

    const channel = supabase
      .channel(`admin-chat-${sel.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${sel.sessionId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const newMsg: Msg = {
            id: String(raw.id),
            sessionId: String(raw.session_id ?? raw.sessionId ?? sel.sessionId),
            message: String(raw.message ?? ''),
            sender: (raw.sender as Msg['sender']) ?? 'user',
            createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
          };
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [sel?.sessionId]);

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
    if (r.ok) { toast.success('Чат перехвачен!'); setSel(p => p ? { ...p, aiDisabled: true } : p); }
    else toast.error('Ошибка');
  };

  const sendMsg = async () => {
    if (!input.trim() || !sel || sending || !taken) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    try {
      const r = await fetch(`/api/admin/support-chats/${encodeURIComponent(sel.sessionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (!r.ok) throw new Error('Send failed');
      await loadMessages(sel.sessionId);
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

  const del = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить чат?')) return;
    const r = await fetch('/api/admin/support-chats/delete', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }),
    });
    if (r.ok) { toast.success('Удалено'); if (sel?.sessionId === sid) { setSel(null); setMessages([]); } }
    else toast.error('Ошибка');
  };

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-7 w-7 text-violet-400" />
              Чаты поддержки
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Всего чатов: {sessions.length} • Активных: {sessions.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/60">Live режим</span>
            </div>
            <button onClick={() => loadSessions()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Всего чатов', value: sessions.length, icon: MessageCircle, color: 'bg-violet-500/20 text-violet-400' },
            { label: 'Активные', value: sessions.filter(s => s.status === 'active').length, icon: Zap, color: 'bg-emerald-500/20 text-emerald-400' },
            { label: 'Решенные', value: sessions.filter(s => s.status === 'resolved').length, icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400' },
            { label: 'Перехвачено', value: sessions.filter(s => s.aiDisabled).length, icon: Shield, color: 'bg-amber-500/20 text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 hover:bg-white/[0.08] transition-all backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} backdrop-blur-sm shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)] min-h-[600px]">
          {/* Left Column - Chat List */}
          <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Filter Tabs */}
            <div className="p-4 border-b border-white/10 flex gap-2">
              {(['all','active','resolved'] as const).map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    filter===f 
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
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
                    <div className="h-12 w-12 animate-spin rounded-full border-3 border-violet-500/30 border-t-violet-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-violet-400" />
                    </div>
                  </div>
                </div>
              ) : filtered.length===0 ? (
                <div className="p-8 text-center text-white/30 text-sm flex flex-col items-center gap-3">
                  <MessageCircle className="h-12 w-12 opacity-20" />
                  <p>Нет чатов</p>
                </div>
              ) : (
                filtered.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setSel(s)}
                    className={`border-b border-white/5 p-4 cursor-pointer hover:bg-white/5 transition-all ${
                      sel?.id===s.id ? 'bg-violet-500/10 border-l-2 border-l-violet-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status==='active'?'bg-emerald-400 animate-pulse':'bg-white/20'}`}/>
                        <span className="text-sm font-medium truncate text-white">{s.userName||s.userEmail||'Гость'}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {s.aiDisabled && <Shield className="h-4 w-4 text-emerald-400"/>}
                        <button 
                          onClick={(e)=>del(s.sessionId,e)} 
                          className="p-1 text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 truncate ml-4 mb-2">{s.firstMessage||''}</p>
                    <div className="flex justify-between ml-4">
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {s.messageCount||0}
                      </span>
                      {s.lastMessageAt && (
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(s.lastMessageAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Chat Area */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm flex flex-col overflow-hidden">
            {sel ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-base text-white">{sel.userName||sel.userEmail||'Гость'}</p>
                      <p className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                        {taken ? (
                          <>
                            <Shield className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Вы в чате</span>
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3 text-violet-400" />
                            <span className="text-violet-400">AI отвечает</span>
                          </>
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={(e)=>del(sel.sessionId,e)} 
                      className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="h-5 w-5"/>
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {!taken
                      ? (
                        <button 
                          onClick={()=>takeover(sel.sessionId)} 
                          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-xl text-xs font-medium hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20"
                        >
                          Перехватить чат
                        </button>
                      )
                      : (
                        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium border border-emerald-500/30">
                          Вы ведёте чат
                        </span>
                      )
                    }
                    {sel.status==='active' && (
                      <button 
                        onClick={()=>setStatus(sel.sessionId,'resolved')} 
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-500/30 transition-all border border-blue-500/30 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4"/> 
                        Решено
                      </button>
                    )}
                    <button 
                      onClick={()=>setStatus(sel.sessionId,'archived')} 
                      className="px-4 py-2 bg-white/5 text-white/60 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white transition-all border border-white/10 flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4"/> 
                      Архив
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
                  {messages.length===0
                    ? (
                      <div className="flex items-center justify-center h-full text-white/30">
                        <div className="text-center flex flex-col items-center gap-3">
                          <MessageCircle className="h-16 w-16 opacity-20" />
                          <p className="text-sm">Нет сообщений</p>
                        </div>
                      </div>
                    )
                    : messages.map(m => (
                      <div key={m.id} className={`flex gap-3 ${m.sender==='user'?'justify-start':'justify-end'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          m.sender==='user' ? 'bg-blue-500/20 text-blue-400' :
                          m.sender==='admin' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-violet-500/20 text-violet-400'
                        }`}>
                          {m.sender==='user' ? <User className="w-4 h-4"/> :
                           m.sender==='admin' ? <Shield className="w-4 h-4"/> :
                           <Bot className="w-4 h-4"/>}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          m.sender==='user' ? 'bg-white/5 text-white border border-white/10 rounded-tl-none' :
                          m.sender==='admin' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-tr-none' :
                          'bg-violet-500/20 text-violet-100 border border-violet-500/30 rounded-tr-none'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                          <span className="text-xs mt-2 block opacity-50">
                            {new Date(m.createdAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
                            {m.sender==='admin' && ' • Вы'}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                  <div ref={endRef}/>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 flex-shrink-0">
                  {!taken && (
                    <p className="text-xs text-center text-white/30 mb-3 flex items-center justify-center gap-2">
                      <Shield className="h-3 w-3" />
                      Перехватите чат чтобы писать
                    </p>
                  )}
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={input} 
                      onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                      placeholder={taken?"Напишите сообщение...":"Сначала перехватите чат..."}
                      disabled={!taken||sending}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 text-white placeholder-white/30 disabled:opacity-40 transition-all"
                    />
                    <button 
                      onClick={sendMsg} 
                      disabled={!input.trim()||sending||!taken}
                      className="px-4 py-3 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-xl disabled:opacity-40 hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20"
                    >
                      <Send className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/30">
                <div className="text-center flex flex-col items-center gap-4">
                  <div className="relative">
                    <MessageCircle className="h-20 w-20 opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-violet-400/30" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-medium text-white/40">Выберите чат</p>
                    <p className="text-xs text-white/20 mt-1">Начните общение с пользователем</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default SupportChatsPage;