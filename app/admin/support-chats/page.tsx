'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageCircle, Send, CheckCircle, Archive, User, Bot, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender: 'user' | 'ai' | 'admin';
  ai_model: string | null;
  created_at: string;
}

interface ChatSession {
  id: string;
  session_id: string;
  user_email: string | null;
  user_name: string | null;
  status: 'active' | 'resolved' | 'archived';
  message_count: number | null;
  first_message: string | null;
  last_message_at: string | null;
  ai_disabled: boolean | null;
  created_at: string;
}

export default function SupportChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'archived'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTakenOver = selectedSession?.ai_disabled === true;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from('support_chat_sessions')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (data) { setSessions(data); setIsLoading(false); }
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('support_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    loadSessions();
    const ch = supabase.channel('sessions-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chat_sessions' }, loadSessions)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!selectedSession) { setMessages([]); return; }
    loadMessages(selectedSession.session_id);
    const ch = supabase.channel('msgs-' + selectedSession.session_id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_chat_messages',
        filter: `session_id=eq.${selectedSession.session_id}`,
      }, (p) => setMessages(prev => [...prev, p.new as ChatMessage]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedSession?.session_id]);

  const handleTakeOver = async (sessionId: string) => {
    const res = await fetch('/api/admin/support-chats/takeover', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) { toast.success('Чат перехвачен!'); setSelectedSession(p => p ? { ...p, ai_disabled: true } : p); }
    else toast.error('Ошибка');
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedSession || isSending || !isTakenOver) return;
    const msg = messageInput.trim();
    setMessageInput('');
    setIsSending(true);
    const res = await fetch('/api/admin/support-chats/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selectedSession.session_id, message: msg }),
    });
    if (!res.ok) { setMessageInput(msg); toast.error('Ошибка отправки'); }
    setIsSending(false);
  };

  const handleStatus = async (sessionId: string, status: string) => {
    await fetch('/api/admin/support-chats', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, status }),
    });
    toast.success('Статус обновлен');
    setSelectedSession(p => p ? { ...p, status: status as any } : p);
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить чат?')) return;
    const res = await fetch('/api/admin/support-chats/delete', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) { toast.success('Удалено'); if (selectedSession?.session_id === sessionId) { setSelectedSession(null); setMessages([]); } }
    else toast.error('Ошибка');
  };

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);

  return (
    <AdminLayout currentPage="support-chats">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Чаты поддержки</h1>
          <p className="text-sm text-gray-500">Всего: {sessions.length} • <span className="text-green-500 font-medium">● Realtime</span></p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
              {(['all', 'active', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={'px-3 py-1 rounded-lg text-xs font-medium ' + (filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
                  {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Решенные'}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              {isLoading ? <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
              : filtered.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Нет чатов</div>
              : filtered.map(s => (
                <div key={s.id} onClick={() => { setSelectedSession(s); setMessages([]); }}
                  className={'border-b border-gray-100 dark:border-gray-800 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ' + (selectedSession?.id === s.id ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-l-purple-500' : '')}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={'w-2 h-2 rounded-full ' + (s.status === 'active' ? 'bg-green-500' : 'bg-gray-400')} />
                      <span className="text-sm font-medium truncate text-gray-900 dark:text-white">{s.user_name || s.user_email || 'Гость'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.ai_disabled && <Shield className="h-3.5 w-3.5 text-green-600" />}
                      <button onClick={(e) => handleDelete(s.session_id, e)} className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate ml-4">{s.first_message || '—'}</p>
                  <div className="flex justify-between mt-1 ml-4">
                    <span className="text-xs text-gray-400">{s.message_count || 0} сообщ.</span>
                    {s.last_message_at && <span className="text-xs text-gray-400">{new Date(s.last_message_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {selectedSession ? (
              <>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{selectedSession.user_name || selectedSession.user_email || 'Гость'}</p>
                      <p className="text-xs text-gray-500">{isTakenOver ? '🟢 Вы в чате' : '🤖 AI отвечает'}</p>
                    </div>
                    <button onClick={(e) => handleDelete(selectedSession.session_id, e)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!isTakenOver
                      ? <button onClick={() => handleTakeOver(selectedSession.session_id)} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-medium">✋ Перехватить чат</button>
                      : <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">✅ Вы ведёте чат</span>
                    }
                    {selectedSession.status === 'active' && (
                      <button onClick={() => handleStatus(selectedSession.session_id, 'resolved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Решено</button>
                    )}
                    <button onClick={() => handleStatus(selectedSession.session_id, 'archived')} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Архив</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                  {messages.length === 0
                    ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">Нет сообщений</div>
                    : messages.map(msg => (
                      <div key={msg.id} className={'flex gap-2 ' + (msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse')}>
                        <div className={'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ' + (msg.sender === 'user' ? 'bg-blue-500' : msg.sender === 'admin' ? 'bg-green-500' : 'bg-purple-500')}>
                          {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : msg.sender === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className={'max-w-[75%] rounded-2xl px-3 py-2 ' + (msg.sender === 'user' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-none' : msg.sender === 'admin' ? 'bg-green-500 text-white rounded-tr-none' : 'bg-purple-500 text-white rounded-tr-none')}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <span className="text-xs mt-0.5 block opacity-70">{new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}{msg.sender === 'admin' && ' • Вы'}</span>
                        </div>
                      </div>
                    ))
                  }
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  {!isTakenOver && <p className="text-xs text-center text-gray-400 mb-2">Перехватите чат чтобы писать</p>}
                  <div className="flex gap-2">
                    <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={isTakenOver ? "Напишите сообщение..." : "Сначала перехватите чат..."}
                      disabled={!isTakenOver || isSending}
                      className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-40"
                    />
                    <button onClick={handleSend} disabled={!messageInput.trim() || isSending || !isTakenOver}
                      className="px-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-40">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center"><MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-30" /><p className="text-sm">Выберите чат</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
