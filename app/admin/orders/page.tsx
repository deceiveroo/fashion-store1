'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, Download, Eye, ChevronDown, RefreshCw, ShoppingBag, TrendingUp, AlertCircle, Filter, Edit2, Trash2, X, Save, Zap, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import AdminShell from '@/components/admin/AdminShell';
import OrderReceipt from '@/components/receipts/OrderReceipt';
import html2canvas from 'html2canvas';

interface Order {
  id: string; userId: string; total: number; status: string; createdAt: string;
  comment?: string; deliveryMethod?: string; paymentMethod?: string;
  userEmail?: string; userName?: string;
  recipient?: { firstName: string; lastName: string; email: string; phone: string; address?: string };
  items?: { id: string; name: string; quantity: number; price: number; image?: string; size?: string; color?: string }[];
  trackingNumber?: string;
  trackingStatus?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  trackingHistory?: any[];
}

const STATUS = {
  pending:    { label: 'Ожидает',   cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',   dot: 'bg-amber-500',   icon: Clock },
  processing: { label: 'Обработка', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',       dot: 'bg-blue-500',    icon: Package },
  shipped:    { label: 'Отправлен', cls: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30', dot: 'bg-violet-500',  icon: Truck },
  delivered:  { label: 'Доставлен', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled:  { label: 'Отменён',   cls: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',          dot: 'bg-red-500',     icon: XCircle },
  returned:   { label: 'Возврат',   cls: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30',       dot: 'bg-zinc-500',    icon: XCircle },
} as const;

const LIMIT = 50;

export default function AdminOrdersPage() {
  const { showConfirm } = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

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
    const confirmed = await showConfirm({
      title: 'Удаление заказа',
      message: 'Удалить заказ? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger',
    });
    
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { setOrders(o => o.filter(x => x.id !== id)); toast.success('Удалён'); }
      else toast.error('Ошибка удаления');
    } catch { toast.error('Ошибка'); }
  };

  const downloadReceipt = async (order: Order) => {
    setIsGeneratingReceipt(true);
    setReceiptOrderId(order.id);
    
    try {
      // Небольшая задержка чтобы React отрендерил компонент
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.getElementById(`admin-order-receipt-${order.id}`);
      
      if (!element) {
        throw new Error('Элемент чека не найден');
      }

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        allowTaint: true,
        foreignObjectRendering: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Не удалось создать изображение');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const orderNumber = order.id.slice(0, 8).toUpperCase();
        link.download = `чек_${orderNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Чек скачан');
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Ошибка при создании чека:', error);
      toast.error('Не удалось создать чек');
    } finally {
      setIsGeneratingReceipt(false);
      setReceiptOrderId(null);
    }
  };

  const saveOrder = async () => {
    if (!editingOrder) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status: editingOrder.status, 
          recipient: editingOrder.recipient, 
          comment: editingOrder.comment, 
          deliveryMethod: editingOrder.deliveryMethod, 
          paymentMethod: editingOrder.paymentMethod,
          trackingNumber: editingOrder.trackingNumber,
          trackingStatus: editingOrder.trackingStatus,
          currentLocation: editingOrder.currentLocation,
          estimatedDelivery: editingOrder.estimatedDelivery,
          trackingHistory: editingOrder.trackingHistory
        }),
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
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text)] flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-[var(--admin-accent)]" />
              Заказы
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">Управление заказами магазина</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => loadOrders(page)} className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] px-4 py-2.5 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] transition-all">
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-[var(--admin-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-all">
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Всего заказов', value: stats.total, icon: ShoppingBag, color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', trend: '+12%' },
            { label: 'Выручка', value: `${stats.revenue.toLocaleString('ru-RU')} ₽`, icon: DollarSign, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', trend: '+8.5%' },
            { label: 'Ожидают', value: stats.pending, icon: Clock, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
            { label: 'Доставлено', value: stats.delivered, icon: CheckCircle, color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', trend: '+15%' },
          ].map(({ label, value, icon: Icon, color, trend }) => (
            <div key={label} className="group relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 hover:bg-[var(--admin-card-hover)] transition-all shadow-sm hover:shadow-md">
              {trend && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 shadow-sm">
                  <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</span>
                </div>
              )}
              <div className="relative z-10">
                <p className="text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider mb-3">{label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-[var(--admin-text)]">{value}</p>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <input
              type="text" placeholder="Поиск по ID, email, имени..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] py-2.5 pl-9 pr-8 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
            >
              <option value="all" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">Все статусы</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k} className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[var(--admin-text-faint)]">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Заказов не найдено</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-t-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--admin-border)]">
                    {['Заказ','Клиент','Дата','Статус','Сумма',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider last:text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="relative">
                  {filtered.map(order => {
                    const cfg = STATUS[order.status as keyof typeof STATUS] || STATUS.pending;
                    const Icon = cfg.icon;
                    const isExp = expandedId === order.id;
                    const name = order.recipient ? `${order.recipient.firstName} ${order.recipient.lastName}`.trim() : order.userName || '—';
                    const email = order.recipient?.email || order.userEmail || '—';
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-card-hover)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-accent)]/10">
                                <ShoppingBag className="h-4 w-4 text-[var(--admin-accent)]" />
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--admin-text)] text-xs">#{order.id.slice(0,8).toUpperCase()}</p>
                                <p className="text-[10px] text-[var(--admin-text-faint)]">{order.items?.length || 0} товар(ов)</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-[var(--admin-text)]">{name}</p>
                            <p className="text-[10px] text-[var(--admin-text-faint)] truncate max-w-[160px]">{email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--admin-text-muted)] whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}
                          </td>
                          <td className="px-4 py-3 overflow-visible">
                            <div className="relative group inline-block">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${cfg.cls}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </span>
                              <div className="absolute left-0 top-full mt-1 z-[100] hidden group-hover:block w-36 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] shadow-xl py-1">
                                {Object.entries(STATUS).map(([k, v]) => (
                                  <button key={k} onClick={() => updateStatus(order.id, k)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--admin-card-hover)] transition-colors ${order.status === k ? 'text-[var(--admin-text)] font-semibold' : 'text-[var(--admin-text-muted)]'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
                                    {v.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-bold text-[var(--admin-text)]">{Number(order.total).toLocaleString('ru-RU')} ₽</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setExpandedId(isExp ? null : order.id)}
                                className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 transition-all">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => downloadReceipt(order)}
                                disabled={isGeneratingReceipt && receiptOrderId === order.id}
                                className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                                title="Скачать чек"
                              >
                                {isGeneratingReceipt && receiptOrderId === order.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button onClick={() => setEditingOrder({ ...order })}
                                className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteOrder(order.id)}
                                className="rounded-lg p-1.5 text-[var(--admin-text-faint)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExp && (
                          <tr key={`${order.id}-exp`} className="border-b border-[var(--admin-border)] bg-[var(--admin-bg-muted)]">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-2">Получатель</p>
                                  <div className="space-y-1 text-xs text-[var(--admin-text-muted)]">
                                    <p>{name}</p><p>{email}</p>
                                    {order.recipient?.phone && <p>{order.recipient.phone}</p>}
                                    {order.recipient?.address && <p className="text-[var(--admin-text-faint)]">{order.recipient.address}</p>}
                                  </div>
                                </div>
                                {order.items?.length ? (
                                  <div>
                                    <p className="text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-2">Товары</p>
                                    <div className="space-y-2">
                                      {order.items.map(item => (
                                        <div key={item.id}>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-[var(--admin-text-muted)]">{item.name} × {item.quantity}</span>
                                            <span className="text-[var(--admin-text)] font-medium">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                                          </div>
                                          {(item.size || item.color) && (
                                            <div className="flex gap-2 mt-1">
                                              {item.size && (
                                                <span className="text-[10px] px-2 py-0.5 bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] rounded-full">
                                                  {item.size}
                                                </span>
                                              )}
                                              {item.color && (
                                                <span className="text-[10px] px-2 py-0.5 bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] text-[var(--admin-text-muted)] rounded-full">
                                                  {item.color}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-[var(--admin-border)] px-4 py-3 flex items-center justify-between text-xs text-[var(--admin-text-faint)]">
              <span>Показано {filtered.length} из {orders.length}</span>
              <span>Итого: <span className="text-[var(--admin-text)] font-semibold">{filtered.reduce((s,o) => s+Number(o.total),0).toLocaleString('ru-RU')} ₽</span></span>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > LIMIT && (
            <div className="border-t border-[var(--admin-border)] px-4 py-3 flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] disabled:opacity-30 transition-all">← Назад</button>
              <span className="text-xs text-[var(--admin-text-faint)]">Стр. {page} из {Math.ceil(total/LIMIT)}</span>
              <button onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/LIMIT)}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-card-hover)] disabled:opacity-30 transition-all">Вперёд →</button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--admin-bg-elevated)] border border-[var(--admin-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--admin-border)]">
              <h2 className="text-sm font-bold text-[var(--admin-text)]">Заказ #{editingOrder.id.slice(0,8).toUpperCase()}</h2>
              <button onClick={() => setEditingOrder(null)} className="text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Статус</label>
                <select value={editingOrder.status} onChange={e => setEditingOrder({...editingOrder, status: e.target.value})}
                  className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40">
                  {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k} className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['Доставка','deliveryMethod',['courier','pickup','post'],['Курьер','Самовывоз','Почта']],
                  ['Оплата','paymentMethod',['card','cash','online'],['Карта','Наличные','Онлайн']]].map(([label, field, vals, labels]) => (
                  <div key={field as string}>
                    <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">{label as string}</label>
                    <select value={(editingOrder as any)[field as string] || (vals as string[])[0]}
                      onChange={e => setEditingOrder({...editingOrder, [field as string]: e.target.value})}
                      className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40">
                      {(vals as string[]).map((v,i) => <option key={v} value={v} className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">{(labels as string[])[i]}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Получатель</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['firstName','lastName','email','phone'] as const).map(f => (
                    <input key={f} type="text"
                      placeholder={f==='firstName'?'Имя':f==='lastName'?'Фамилия':f==='email'?'Email':'Телефон'}
                      value={editingOrder.recipient?.[f]||''}
                      onChange={e => setEditingOrder({...editingOrder, recipient:{...editingOrder.recipient!, [f]:e.target.value}})}
                      className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                    />
                  ))}
                  <input type="text" placeholder="Адрес" value={editingOrder.recipient?.address||''}
                    onChange={e => setEditingOrder({...editingOrder, recipient:{...editingOrder.recipient!, address:e.target.value}})}
                    className="col-span-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Комментарий</label>
                <textarea value={editingOrder.comment||''} rows={3}
                  onChange={e => setEditingOrder({...editingOrder, comment:e.target.value})}
                  className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40 resize-none"
                />
              </div>
              
              {/* Tracking Section */}
              <div className="border-t border-[var(--admin-border)] pt-4 mt-4">
                <h3 className="text-xs font-bold text-[var(--admin-text)] mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Отслеживание доставки
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Трек-номер</label>
                      <input type="text" placeholder="TRK-XXXXXXXX"
                        value={editingOrder.trackingNumber||''}
                        onChange={e => setEditingOrder({...editingOrder, trackingNumber:e.target.value})}
                        className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Статус</label>
                      <select value={editingOrder.trackingStatus||'pending'}
                        onChange={e => setEditingOrder({...editingOrder, trackingStatus:e.target.value})}
                        className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40">
                        <option value="pending" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">Ожидает</option>
                        <option value="in_transit" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">В пути</option>
                        <option value="out_for_delivery" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">Доставляется</option>
                        <option value="delivered" className="bg-[var(--admin-bg-elevated)] text-[var(--admin-text)]">Доставлен</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Текущее местоположение</label>
                      <input type="text" placeholder="Москва, склад"
                        value={editingOrder.currentLocation||''}
                        onChange={e => setEditingOrder({...editingOrder, currentLocation:e.target.value})}
                        className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] placeholder-[var(--admin-text-faint)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase mb-1.5">Ожидаемая доставка</label>
                      <input type="date"
                        value={editingOrder.estimatedDelivery? editingOrder.estimatedDelivery.split('T')[0] : ''}
                        onChange={e => setEditingOrder({...editingOrder, estimatedDelivery:e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                        className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-muted)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[var(--admin-border)]">
              <button onClick={saveOrder} disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-colors">
                <Save className="h-4 w-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={() => deleteOrder(editingOrder.id)}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt Components for Download */}
      <div className="fixed left-[-9999px] top-[-9999px]">
        {orders.map(order => (
          <div key={order.id} id={`admin-order-receipt-${order.id}`}>
            <OrderReceipt order={{
              id: order.id,
              items: (order.items || []).map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || '',
                size: item.size,
                color: item.color
              })),
              total: order.total,
              discount: 0,
              deliveryPrice: 0,
              deliveryMethod: order.deliveryMethod || 'pickup',
              paymentMethod: order.paymentMethod || 'card',
              status: order.status as any,
              createdAt: order.createdAt,
              recipient: order.recipient
            }} />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
