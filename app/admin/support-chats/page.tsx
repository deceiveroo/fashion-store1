'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, CheckCircle, Archive, User, Bot, Shield, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface ChatMessage {
  id: string;
  sessionId: string;
  message: string;
  sender: 'user' | 'ai' | 'admin';
  aiModel: string | null;
  createdAt: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  userEmail: string | null;
  userName: string | null;
  status: 'active' | 'resolved' | 'archived';
  messageCount: number | null;
  firstMessage: string | null;
  lastMessageAt: string | null;
  aiDisabled: boolean | null;
  takenOverBy: string | null;
  takenOverAt: string | null;
  createdAt: string;
}

function SupportChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'archived'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedSessionRef = useRef<ChatSession | null>(null);
  const sessionsEsRef = useRef<EventSource | null>(null);
  const messagesEsRef = useRef<EventSource | null>(null);
  const isTakenOver = selectedSession?.aiDisabled === true;

  useEffect(() => { selectedSessionRef.current = selectedSession; }, [selectedSession]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // SSE for sessions list
  useEffect(() => {
    setIsLoading(true);
    const es = new EventSource('/api/admin/support-chats/stream');
    sessionsEsRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'sessions') {
          setSessions(data.sessions || []);
          setIsLoading(false);
          // Sync selected session
          if (selectedSessionRef.current) {
            const updated = (data.sessions || []).find((s: ChatSession) => s.sessionId === selectedSessionRef.current!.sessionId);
            if (updated) setSelectedSession(updated);
          }
        }
      } catch {}
    };

    es.onerror = () => { setIsLoading(false); };

    return () => { es.close(); };
  }, []);

  // SSE for messages when session selected
  useEffect(() => {
    if (messagesEsRef.current) { messagesEsRef.current.close(); messagesEsRef.current = null; }
    if (!selectedSession) { setMessages([]); return; }

    const es = new EventSource(`/api/admin/support-chats/stream?sessionId=${selectedSession.sessionId}`);
    messagesEsRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'messages') setMessages(data.messages || []);
      } catch {}
    };

    return () => { es.close(); };
  }, [selectedSession?.sessionId]);

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    setMessages([]);
  };

  const handleTakeOver = async (sessionId: string) => {
    try {
      const res = await fetch('/api/admin/support-chats/takeover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success('Чат перехвачен!');
        setSelectedSession(prev => prev ? { ...prev, aiDisabled: true } : prev);
      } else toast.error('Не удалось перехватить чат');
    } catch { toast.error('Ошибка'); }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSession || isSending || !isTakenOver) return;
    const msg = messageInput.trim();
    setMessageInput('');
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/support-chats/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession.sessionId, message: msg }),
      });
      if (!res.ok) { setMessageInput(msg); toast.error('Не удалось отправить'); }
    } catch { setMessageInput(msg); toast.error('Ошибка отправки'); }
    finally { setIsSending(false); }
  };

  const handleUpdateStatus = async (sessionId: string, status: 'active' | 'resolved' | 'archived') => {
    try {
      const res = await fetch('/api/admin/support-chats', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status }),
      });
      if (res.ok) {
        toast.success('Статус обновлен');
        setSelectedSession(prev => prev ? { ...prev, status } : prev);
      } else toast.error('Ошибка');
    } catch { toast.error('Ошибка'); }
  };

  const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот чат?')) return;
    try {
      const res = await fetch('/api/admin/support-chats/delete', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success('Чат удалён');
        if (selectedSession?.sessionId === sessionId) { setSelectedSession(null); setMessages([]); }
      } else toast.error('Ошибка удаления');
    } catch { toast.error('Ошибка'); }
  };

  const filteredSessions = sessions.filter(s => filter === 'all' || s.status === filter);

  return (
    <AdminLayout currentPage="support-chats">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Чаты поддержки</h1>
            <p className="text-sm text-gray-500 mt-0.5">Всего: {sessions.length}  <span className="text-green-500"> Live</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
              {(['all', 'active', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={'px-3 py-1 rounded-lg text-xs font-medium ' + (filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
                  {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Решенные'}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500"><MessageCircle className="mx-auto h-10 w-10 mb-2 opacity-40" /><p className="text-sm">Нет чатов</p></div>
              ) : filteredSessions.map(session => (
                <div key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={'border-b border-gray-100 dark:border-gray-800 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ' + (selectedSession?.id === session.id ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-l-purple-500' : '')}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={'w-2 h-2 rounded-full flex-shrink-0 ' + (session.status === 'active' ? 'bg-green-500' : 'bg-gray-400')} />
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{session.userName || session.userEmail || 'Гость'}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      {session.aiDisabled && <Shield className="h-3.5 w-3.5 text-green-600" />}
                      <button onClick={(e) => handleDeleteChat(session.sessionId, e)}
                        className="p-0.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 ml-4">{session.firstMessage || ''}</p>
                  <div className="flex items-center justify-between mt-1 ml-4">
                    <span className="text-xs text-gray-400">{session.messageCount || 0} сообщ.</span>
                    {session.lastMessageAt && (
                      <span className="text-xs text-gray-400">{new Date(session.lastMessageAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {selectedSession ? (
              <>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{selectedSession.userName || selectedSession.userEmail || 'Гость'}</h3>
                      <p className="text-xs text-gray-500">{selectedSession.userEmail || 'Анонимный'}  {isTakenOver ? ' Вы в чате' : ' AI отвечает'}</p>
                    </div>
                    <button onClick={(e) => handleDeleteChat(selectedSession.sessionId, e)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!isTakenOver ? (
                      <button onClick={() => handleTakeOver(selectedSession.sessionId)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all">
                         Перехватить чат
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium"> Вы ведёте чат</span>
                    )}
                    {selectedSession.status === 'active' && (
                      <button onClick={() => handleUpdateStatus(selectedSession.sessionId, 'resolved')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Решено
                      </button>
                    )}
                    <button onClick={() => handleUpdateStatus(selectedSession.sessionId, 'archived')}
                      className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600 flex items-center gap-1">
                      <Archive className="h-3.5 w-3.5" /> Архив
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Нет сообщений</div>
                  ) : messages.map(msg => (
                    <div key={msg.id} className={'flex gap-2 ' + (msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse')}>
                      <div className={'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ' + (msg.sender === 'user' ? 'bg-blue-500' : msg.sender === 'admin' ? 'bg-green-500' : 'bg-purple-500')}>
                        {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : msg.sender === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div className={'max-w-[75%] rounded-2xl px-3 py-2 ' + (msg.sender === 'user' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-none' : msg.sender === 'admin' ? 'bg-green-500 text-white rounded-tr-none' : 'bg-purple-500 text-white rounded-tr-none')}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <span className="text-xs mt-0.5 block opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === 'admin' && '  Вы'}
                          {msg.sender === 'ai' && '  AI'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  {!isTakenOver && (
                    <p className="text-xs text-center text-gray-400 mb-2">Нажмите "Перехватить чат" чтобы писать пользователю</p>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder={isTakenOver ? "Напишите сообщение..." : "Сначала перехватите чат..."}
                      disabled={!isTakenOver || isSending}
                      className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <button onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending || !isTakenOver}
                      className="px-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Выберите чат слева</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SupportChatsPage;