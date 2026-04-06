'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, CheckCircle, Archive, User, Bot, Shield, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

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
  const msgEsRef = useRef<EventSource|null>(null);
  const taken = sel?.aiDisabled === true;

  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load sessions with polling
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
    const t = setInterval(() => loadSessions(true), 3000);
    return () => clearInterval(t);
  }, [loadSessions]);

  // SSE for messages  instant delivery
  useEffect(() => {
    if (msgEsRef.current) { msgEsRef.current.close(); msgEsRef.current = null; }
    if (!sel) { setMessages([]); return; }

    const es = new EventSource(`/api/chat/stream?sessionId=${sel.sessionId}`);
    msgEsRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'init') {
          setMessages(data.messages || []);
        } else if (data.type === 'new') {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const fresh = (data.messages || []).filter((m: Msg) => !ids.has(m.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
      } catch {}
    };

    return () => { es.close(); };
  }, [sel?.sessionId]);

  const takeover = async (sid: string) => {
    const r = await fetch('/api/admin/support-chats/takeover', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }),
    });
    if (r.ok) { toast.success('Чат перехвачен!'); setSel(p => p ? { ...p, aiDisabled: true } : p); }
    else toast.error('Ошибка');
  };

  const sendMsg = async () => {
    if (!input.trim() || !sel || sending || !taken) return;
    const msg = input.trim(); setInput(''); setSending(true);
    const r = await fetch('/api/admin/support-chats/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sel.sessionId, message: msg }),
    });
    if (!r.ok) { setInput(msg); toast.error('Ошибка отправки'); }
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
    <AdminLayout currentPage="support-chats">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Чаты поддержки</h1>
            <p className="text-sm text-gray-500">Всего: {sessions.length}  <span className="text-green-500"> Live</span></p>
          </div>
          <button onClick={() => loadSessions()} className="p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100"><RefreshCw className="h-5 w-5"/></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Sessions */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
              {(['all','active','resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={'px-3 py-1 rounded-lg text-xs font-medium '+(filter===f?'bg-purple-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
                  {f==='all'?'Все':f==='active'?'Активные':'Решенные'}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"/></div>
              : filtered.length===0 ? <div className="p-8 text-center text-gray-400 text-sm">Нет чатов</div>
              : filtered.map(s => (
                <div key={s.id} onClick={() => { setSel(s); setMessages([]); }}
                  className={'border-b border-gray-100 dark:border-gray-800 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 '+(sel?.id===s.id?'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-l-purple-500':'')}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={'w-2 h-2 rounded-full '+(s.status==='active'?'bg-green-500':'bg-gray-400')}/>
                      <span className="text-sm font-medium truncate text-gray-900 dark:text-white">{s.userName||s.userEmail||'Гость'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {s.aiDisabled && <Shield className="h-3.5 w-3.5 text-green-600"/>}
                      <button onClick={(e)=>del(s.sessionId,e)} className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate ml-4">{s.firstMessage||''}</p>
                  <div className="flex justify-between mt-1 ml-4">
                    <span className="text-xs text-gray-400">{s.messageCount||0} сообщ.</span>
                    {s.lastMessageAt && <span className="text-xs text-gray-400">{new Date(s.lastMessageAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {sel ? (
              <>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{sel.userName||sel.userEmail||'Гость'}</p>
                      <p className="text-xs text-gray-500">{taken?' Вы в чате':' AI отвечает'}</p>
                    </div>
                    <button onClick={(e)=>del(sel.sessionId,e)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4"/></button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!taken
                      ? <button onClick={()=>takeover(sel.sessionId)} className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-medium"> Перехватить чат</button>
                      : <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium"> Вы ведёте чат</span>
                    }
                    {sel.status==='active' && <button onClick={()=>setStatus(sel.sessionId,'resolved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5"/> Решено</button>}
                    <button onClick={()=>setStatus(sel.sessionId,'archived')} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Archive className="h-3.5 w-3.5"/> Архив</button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                  {messages.length===0
                    ? <div className="flex items-center justify-center h-full text-gray-400 text-sm">Нет сообщений</div>
                    : messages.map(m => (
                      <div key={m.id} className={'flex gap-2 '+(m.sender==='user'?'flex-row':'flex-row-reverse')}>
                        <div className={'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white '+(m.sender==='user'?'bg-blue-500':m.sender==='admin'?'bg-green-500':'bg-purple-500')}>
                          {m.sender==='user'?<User className="w-3.5 h-3.5"/>:m.sender==='admin'?<Shield className="w-3.5 h-3.5"/>:<Bot className="w-3.5 h-3.5"/>}
                        </div>
                        <div className={'max-w-[75%] rounded-2xl px-3 py-2 '+(m.sender==='user'?'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-none':m.sender==='admin'?'bg-green-500 text-white rounded-tr-none':'bg-purple-500 text-white rounded-tr-none')}>
                          <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                          <span className="text-xs mt-0.5 block opacity-70">{new Date(m.createdAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}{m.sender==='admin'&&'  Вы'}</span>
                        </div>
                      </div>
                    ))
                  }
                  <div ref={endRef}/>
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  {!taken && <p className="text-xs text-center text-gray-400 mb-2">Перехватите чат чтобы писать</p>}
                  <div className="flex gap-2">
                    <input type="text" value={input} onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                      placeholder={taken?"Напишите сообщение...":"Сначала перехватите чат..."}
                      disabled={!taken||sending}
                      className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-40"
                    />
                    <button onClick={sendMsg} disabled={!input.trim()||sending||!taken}
                      className="px-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-40">
                      <Send className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center"><MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-30"/><p className="text-sm">Выберите чат</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SupportChatsPage;