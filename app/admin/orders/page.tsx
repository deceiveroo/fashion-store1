'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, Download, Eye, ChevronDown, RefreshCw, ShoppingBag, TrendingUp, AlertCircle, Filter, Edit2, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface Order {
  id: string; userId: string; total: number; status: string; createdAt: string;
  comment?: string; deliveryMethod?: string; paymentMethod?: string;
  userEmail?: string; userName?: string;
  recipient?: { firstName: string; lastName: string; email: string; phone: string; address?: string };
  items?: { id: string; name: string; quantity: number; price: number; image?: string }[];
}

const STATUS = {
  pending:    { label: 'Ожидает',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   dot: 'bg-amber-400',   icon: Clock },
  processing: { label: 'Обработка', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       dot: 'bg-blue-400',    icon: Package },
  shipped:    { label: 'Отправлен', cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20', dot: 'bg-violet-400',  icon: Truck },
  delivered:  { label: 'Доставлен', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', icon: CheckCircle },
  cancelled:  { label: 'Отменён',   cls: 'bg-red-500/10 text-red-400 border-red-500/20',          dot: 'bg-red-400',     icon: XCircle },
  returned:   { label: 'Возврат',   cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',       dot: 'bg-zinc-400',    icon: XCircle },
} as const;

const LIMIT = 50;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadOrders = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${p}&limit=${LIMIT}`, { credentials: 'include' });
      if (!res.ok) { toast.error('Не удалось загрузить заказы'); return; }
      const data = await res.json();
      if (Array.isArray(data)) { setOrders(data); setTotal(data.length); }
      else { setOrders(data.orders || []); setTotal(data.total || 0); }
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrders(page); }, [page, loadOrders]);

  const updateStatus = async (id: string, status: string) => {
    const prev = orders.find(o => o.id === id)?.status;
    setOrders(o => o.map(x => x.id === id ? { ...x, status } : x)); // optimistic
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status }),
      });
      if (!res.ok) { setOrders(o => o.map(x => x.id === id ? { ...x, status: prev! } : x)); toast.error('Ошибка'); }
      else toast.success('Статус обновлён');
    } catch { setOrders(o => o.map(x => x.id === id ? { ...x, status: prev! } : x)); toast.error('Ошибка'); }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Удалить заказ?')) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setOrders(o => o.filter(x => x.id !== id)); toast.success('Удалён'); }
      else toast.error('Ошибка удаления');
    } catch { toast.error('Ошибка'); }
  };

  const saveOrder = async () => {
    if (!editingOrder) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: editingOrder.status, recipient: editingOrder.recipient, comment: editingOrder.comment, deliveryMethod: editingOrder.deliveryMethod, paymentMethod: editingOrder.paymentMethod }),
      });
      if (res.ok) { setOrders(o => o.map(x => x.id === editingOrder.id ? editingOrder : x)); setEditingOrder(null); toast.success('Сохранено'); }
      else toast.error('Ошибка сохранения');
    } catch { toast.error('Ошибка'); }
    finally { setIsSaving(false); }
  };

  const exportCSV = () => {
    const rows = [
      ['ID','Дата','Клиент','Email','Статус','Сумма'],
      ...filtered.map(o => [
        o.id.slice(0,8),
        new Date(o.createdAt).toLocaleDateString('ru-RU'),
        `${o.recipient?.firstName||o.userName||''} ${o.recipient?.lastName||''}`.trim(),
        o.recipient?.email||o.userEmail||'',
        STATUS[o.status as keyof typeof STATUS]?.label||o.status,
        o.total,
      ]),
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+rows], { type: 'text/csv;charset=utf-8;' }));
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || (o.recipient?.email||o.userEmail||'').toLowerCase().includes(q) || (o.recipient?.firstName||o.userName||'').toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'all' || o.status === statusFilter);
  });

  const stats = {
    total: orders.length,
    revenue: orders.reduce((s, o) => s + Number(o.total), 0),
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Заказы</h1>
            <p className="text-sm text-white/40">Управление заказами</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadOrders(page)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
              <Download className="h-4 w-4" />
              Экспорт
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Всего', value: stats.total, icon: ShoppingBag, color: 'text-violet-400' },
            { label: 'Выручка', value: `${stats.revenue.toLocaleString('ru-RU')} ₽`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Ожидают', value: stats.pending, icon: AlertCircle, color: 'text-amber-400' },
            { label: 'Доставлено', value: stats.delivered, icon: CheckCircle, color: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
                  <p className="mt-1 text-xl font-bold text-white">{value}</p>
                </div>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <input
              type="text" placeholder="Поиск по ID, email, имени..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/20 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-8 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            >
              <option value="all" className="bg-[#0f0f1a]">Все статусы</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k} className="bg-[#0f0f1a]">{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Заказов не найдено</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Заказ','Клиент','Дата','Статус','Сумма',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider last:text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const cfg = STATUS[order.status as keyof typeof STATUS] || STATUS.pending;
                    const Icon = cfg.icon;
                    const isExp = expandedId === order.id;
                    const name = order.recipient ? `${order.recipient.firstName} ${order.recipient.lastName}`.trim() : order.userName || '—';
                    const email = order.recipient?.email || order.userEmail || '—';
                    return (
                      <>
                        <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                                <ShoppingBag className="h-4 w-4 text-violet-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-xs">#{order.id.slice(0,8).toUpperCase()}</p>
                                <p className="text-[10px] text-white/30">{order.items?.length || 0} товар(ов)</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-white">{name}</p>
                            <p className="text-[10px] text-white/30 truncate max-w-[160px]">{email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative group inline-block">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${cfg.cls}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </span>
                              <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-36 rounded-xl border border-white/10 bg-[#0f0f1a] shadow-xl py-1">
                                {Object.entries(STATUS).map(([k, v]) => (
                                  <button key={k} onClick={() => updateStatus(order.id, k)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${order.status === k ? 'text-white font-semibold' : 'text-white/50'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
                                    {v.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-white">{Number(order.total).toLocaleString('ru-RU')} ₽</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setExpandedId(isExp ? null : order.id)}
                                className="rounded-lg p-1.5 text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingOrder({ ...order })}
                                className="rounded-lg p-1.5 text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteOrder(order.id)}
                                className="rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExp && (
                          <tr key={`${order.id}-exp`} className="border-b border-white/5 bg-white/[0.01]">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold text-white/30 uppercase mb-2">Получатель</p>
                                  <div className="space-y-1 text-xs text-white/60">
                                    <p>{name}</p><p>{email}</p>
                                    {order.recipient?.phone && <p>{order.recipient.phone}</p>}
                                    {order.recipient?.address && <p className="text-white/30">{order.recipient.address}</p>}
                                  </div>
                                </div>
                                {order.items?.length ? (
                                  <div>
                                    <p className="text-[10px] font-semibold text-white/30 uppercase mb-2">Товары</p>
                                    <div className="space-y-1">
                                      {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between text-xs">
                                          <span className="text-white/60">{item.name} × {item.quantity}</span>
                                          <span className="text-white/80 font-medium">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-white/5 px-4 py-3 flex items-center justify-between text-xs text-white/30">
              <span>Показано {filtered.length} из {orders.length}</span>
              <span>Итого: <span className="text-white/60 font-semibold">{filtered.reduce((s,o) => s+Number(o.total),0).toLocaleString('ru-RU')} ₽</span></span>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > LIMIT && (
            <div className="border-t border-white/5 px-4 py-3 flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">← Назад</button>
              <span className="text-xs text-white/30">Стр. {page} из {Math.ceil(total/LIMIT)}</span>
              <button onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/LIMIT)}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">Вперёд →</button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">Заказ #{editingOrder.id.slice(0,8).toUpperCase()}</h2>
              <button onClick={() => setEditingOrder(null)} className="text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Статус</label>
                <select value={editingOrder.status} onChange={e => setEditingOrder({...editingOrder, status: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                  {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k} className="bg-[#0f0f1a]">{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Доставка','deliveryMethod',['courier','pickup','post'],['Курьер','Самовывоз','Почта']],
                  ['Оплата','paymentMethod',['card','cash','online'],['Карта','Наличные','Онлайн']]].map(([label, field, vals, labels]) => (
                  <div key={field as string}>
                    <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">{label as string}</label>
                    <select value={(editingOrder as any)[field as string] || (vals as string[])[0]}
                      onChange={e => setEditingOrder({...editingOrder, [field as string]: e.target.value})}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50">
                      {(vals as string[]).map((v,i) => <option key={v} value={v} className="bg-[#0f0f1a]">{(labels as string[])[i]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Получатель</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['firstName','lastName','email','phone'] as const).map(f => (
                    <input key={f} type="text"
                      placeholder={f==='firstName'?'Имя':f==='lastName'?'Фамилия':f==='email'?'Email':'Телефон'}
                      value={editingOrder.recipient?.[f]||''}
                      onChange={e => setEditingOrder({...editingOrder, recipient:{...editingOrder.recipient!, [f]:e.target.value}})}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
                    />
                  ))}
                  <input type="text" placeholder="Адрес" value={editingOrder.recipient?.address||''}
                    onChange={e => setEditingOrder({...editingOrder, recipient:{...editingOrder.recipient!, address:e.target.value}})}
                    className="col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Комментарий</label>
                <textarea value={editingOrder.comment||''} rows={3}
                  onChange={e => setEditingOrder({...editingOrder, comment:e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/5">
              <button onClick={saveOrder} disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
                <Save className="h-4 w-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={() => deleteOrder(editingOrder.id)}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
