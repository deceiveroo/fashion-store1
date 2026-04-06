'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, CheckCircle, Archive, User, Bot, Shield, Trash2 } from 'lucide-react';
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'archived'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.sessionId);
      pollIntervalRef.current = setInterval(() => loadMessages(selectedSession.sessionId, true), 3000);
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [selectedSession]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/support-chats');
      if (res.ok) { const data = await res.json(); setSessions(data.sessions || []); }
      else toast.error('Не удалось загрузить чаты');
    } catch { toast.error('Ошибка загрузки чатов'); }
    finally { setIsLoading(false); }
  };

  const loadMessages = async (sessionId: string, silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await fetch('/api/admin/support-chats/' + sessionId);
      if (res.ok) { const data = await res.json(); setMessages(data.messages || []); }
    } catch { if (!silent) toast.error('Ошибка загрузки сообщений'); }
    finally { if (!silent) setIsLoadingMessages(false); }
  };

  const handleTakeOver = async (sessionId: string) => {
    try {
      const res = await fetch('/api/admin/support-chats/takeover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success('Чат перехвачен! AI отключен.');
        loadSessions();
        if (selectedSession?.sessionId === sessionId) setSelectedSession({ ...selectedSession, aiDisabled: true });
      } else toast.error('Не удалось перехватить чат');
    } catch { toast.error('Ошибка при перехвате чата'); }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSession || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/support-chats/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession.sessionId, message: messageInput }),
      });
      if (res.ok) { setMessageInput(''); loadMessages(selectedSession.sessionId); loadSessions(); }
      else toast.error('Не удалось отправить сообщение');
    } catch { toast.error('Ошибка отправки сообщения'); }
    finally { setIsSending(false); }
  };

  const handleUpdateStatus = async (sessionId: string, status: 'active' | 'resolved' | 'archived') => {
    try {
      const res = await fetch('/api/admin/support-chats', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status }),
      });
      if (res.ok) {
        toast.success('Статус обновлен'); loadSessions();
        if (selectedSession?.sessionId === sessionId) setSelectedSession({ ...selectedSession, status });
      } else toast.error('Не удалось обновить статус');
    } catch { toast.error('Ошибка обновления статуса'); }
  };

  const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот чат и все сообщения?')) return;
    try {
      const res = await fetch('/api/admin/support-chats/delete', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success('Чат удалён');
        if (selectedSession?.sessionId === sessionId) setSelectedSession(null);
        loadSessions();
      } else toast.error('Не удалось удалить чат');
    } catch { toast.error('Ошибка удаления'); }
  };

  const filteredSessions = sessions.filter(s => filter === 'all' || s.status === filter);

  return (
    <AdminLayout currentPage="support-chats">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Чаты поддержки</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Всего чатов: {sessions.length}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
              {(['all', 'active', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={'px-3 py-1 rounded-lg text-sm font-medium ' + (filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
                  {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Решенные'}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {isLoading ? (
                <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400"><MessageCircle className="mx-auto h-12 w-12 mb-2" /><p>Нет чатов</p></div>
              ) : filteredSessions.map(session => (
                <div key={session.id} className={'border-b border-gray-200 dark:border-gray-700 ' + (selectedSession?.id === session.id ? 'bg-purple-50 dark:bg-purple-900/20' : '')}>
                  <div onClick={() => setSelectedSession(session)} className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{session.userName || session.userEmail || 'Гость'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {session.aiDisabled && <Shield className="h-4 w-4 text-green-600" />}
                        <button onClick={(e) => handleDeleteChat(session.sessionId, e)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{session.firstMessage || 'Нет сообщений'}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={'px-2 py-0.5 rounded-full ' + (session.status === 'active' ? 'bg-green-100 text-green-800' : session.status === 'resolved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')}>
                        {session.status}
                      </span>
                      <span className="text-gray-500">{session.messageCount || 0} сообщ.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{selectedSession.userName || selectedSession.userEmail || 'Гость'}</h3>
                      <p className="text-xs text-gray-500">{selectedSession.userEmail || 'Анонимный'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => handleDeleteChat(selectedSession.sessionId, e)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setSelectedSession(null)} className="lg:hidden text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!selectedSession.aiDisabled && (
                      <button onClick={() => handleTakeOver(selectedSession.sessionId)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                        Перехватить чат
                      </button>
                    )}
                    {selectedSession.status === 'active' && (
                      <button onClick={() => handleUpdateStatus(selectedSession.sessionId, 'resolved')}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Решено
                      </button>
                    )}
                    {selectedSession.status !== 'archived' && (
                      <button onClick={() => handleUpdateStatus(selectedSession.sessionId, 'archived')}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-1">
                        <Archive className="h-4 w-4" /> Архив
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800 min-h-[400px] max-h-[calc(100vh-400px)]">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500"><p>Нет сообщений</p></div>
                  ) : messages.map(msg => (
                    <div key={msg.id} className={'flex gap-3 ' + (msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse')}>
                      <div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + (msg.sender === 'user' ? 'bg-blue-500' : msg.sender === 'admin' ? 'bg-green-500' : 'bg-purple-500')}>
                        {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : msg.sender === 'admin' ? <Shield className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                      <div className={'max-w-[70%] rounded-2xl p-3 ' + (msg.sender === 'user' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600' : msg.sender === 'admin' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white')}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <span className={'text-xs mt-1 block ' + (msg.sender === 'user' ? 'text-gray-500' : 'text-white/70')}>
                          {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedSession.aiDisabled && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Напишите сообщение..." disabled={isSending}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-50" />
                    <button onClick={handleSendMessage} disabled={!messageInput.trim() || isSending}
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center"><MessageCircle className="mx-auto h-12 w-12 mb-2" /><p>Выберите чат для просмотра</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SupportChatsPage;