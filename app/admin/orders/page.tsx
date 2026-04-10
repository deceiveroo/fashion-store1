'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  Search, Package, Clock, CheckCircle, XCircle, Truck,
  Download, Eye, ChevronDown, RefreshCw, ShoppingBag,
  TrendingUp, AlertCircle, Filter, Edit2, Trash2, X, Save
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  comment?: string;
  deliveryMethod?: string;
  paymentMethod?: string;
  userEmail?: string;
  userName?: string;
  recipient?: { firstName: string; lastName: string; email: string; phone: string; address?: string };
  items?: Array<{ id: string; name: string; quantity: number; price: number; image?: string }>;
}

const STATUS = {
  pending:    { label: 'Ожидает',   bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   icon: Clock },
  processing: { label: 'Обработка', bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500',    icon: Package },
  shipped:    { label: 'Отправлен', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500',  icon: Truck },
  delivered:  { label: 'Доставлен', bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500',   icon: CheckCircle },
  cancelled:  { label: 'Отменён',   bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',     icon: XCircle },
} as const;

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
  const LIMIT = 50;

  useEffect(() => { loadOrders(page); }, [page]);

  const loadOrders = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${p}&limit=${LIMIT}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // Support both old array format and new paginated format
        if (Array.isArray(data)) {
          setOrders(data);
          setTotal(data.length);
        } else {
          setOrders(data.orders || []);
          setTotal(data.total || 0);
        }
      } else toast.error('Не удалось загрузить заказы');
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        toast.success('Статус обновлён');
      } else toast.error('Ошибка обновления статуса');
    } catch { toast.error('Ошибка соединения'); }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Удалить заказ? Это действие необратимо.')) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        toast.success('Заказ удалён');
      } else toast.error('Ошибка удаления');
    } catch { toast.error('Ошибка соединения'); }
  };

  const saveOrder = async () => {
    if (!editingOrder) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: editingOrder.status,
          recipient: editingOrder.recipient,
          comment: editingOrder.comment,
          deliveryMethod: editingOrder.deliveryMethod,
          paymentMethod: editingOrder.paymentMethod,
        }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === editingOrder.id ? editingOrder : o));
        setEditingOrder(null);
        toast.success('Заказ сохранён');
      } else toast.error('Ошибка сохранения');
    } catch { toast.error('Ошибка соединения'); }
    finally { setIsSaving(false); }
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Дата', 'Клиент', 'Email', 'Статус', 'Сумма'],
      ...filtered.map(o => [
        o.id.slice(0, 8),
        new Date(o.createdAt).toLocaleDateString('ru-RU'),
        `${o.recipient?.firstName || o.userName || ''} ${o.recipient?.lastName || ''}`.trim(),
        o.recipient?.email || o.userEmail || '',
        STATUS[o.status as keyof typeof STATUS]?.label || o.status,
        o.total,
      ]),
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8;' }));
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Экспортировано');
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) ||
      (o.recipient?.email || o.userEmail || '').toLowerCase().includes(q) ||
      (o.recipient?.firstName || o.userName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    revenue: orders.reduce((s, o) => s + Number(o.total), 0),
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <AdminLayout currentPage="orders">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Заказы</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Управление и отслеживание заказов</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadOrders(page)} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-sm">
              <Download className="h-4 w-4" />
              Экспорт
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Всего заказов', value: stats.total, icon: ShoppingBag, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
            { label: 'Выручка', value: `${stats.revenue.toLocaleString('ru-RU')} ₽`, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Ожидают', value: stats.pending, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Доставлено', value: stats.delivered, icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Поиск по ID, email, имени..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 pl-9 pr-8 text-sm text-zinc-900 dark:text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">Все статусы</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <Package className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">Заказов не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Заказ</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Клиент</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Дата</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Статус</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Сумма</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.map(order => {
                    const cfg = STATUS[order.status as keyof typeof STATUS] || STATUS.pending;
                    const Icon = cfg.icon;
                    const isExpanded = expandedId === order.id;
                    const clientName = order.recipient
                      ? `${order.recipient.firstName} ${order.recipient.lastName}`.trim()
                      : order.userName || '—';
                    const clientEmail = order.recipient?.email || order.userEmail || '—';

                    return (
                      <>
                        <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20 flex-shrink-0">
                                <ShoppingBag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">#{order.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs text-zinc-400">{order.items?.length || 0} товар(ов)</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{clientName}</p>
                            <p className="text-xs text-zinc-400 truncate max-w-[180px]">{clientEmail}</p>
                          </td>
                          <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <div className="relative group inline-block">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </span>
                              <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg py-1">
                                {Object.entries(STATUS).map(([k, v]) => (
                                  <button
                                    key={k}
                                    onClick={() => updateStatus(order.id, k)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${order.status === k ? 'font-semibold' : ''}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
                                    <span className={v.text}>{v.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{Number(order.total).toLocaleString('ru-RU')} ₽</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {isExpanded ? 'Скрыть' : 'Детали'}
                              </button>
                              <button
                                onClick={() => setEditingOrder({ ...order })}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${order.id}-expanded`} className="bg-zinc-50 dark:bg-zinc-800/30">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Получатель</p>
                                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                                    <p>{clientName}</p>
                                    <p>{clientEmail}</p>
                                    {order.recipient?.phone && <p>{order.recipient.phone}</p>}
                                    {order.recipient?.address && <p className="text-zinc-500">{order.recipient.address}</p>}
                                  </div>
                                </div>
                                {order.items && order.items.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">Товары</p>
                                    <div className="space-y-1">
                                      {order.items.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                          <span className="text-zinc-700 dark:text-zinc-300">{item.name} × {item.quantity}</span>
                                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
          {!loading && filtered.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Показано {filtered.length} из {orders.length} заказов</span>
              <span>Итого: <strong className="text-zinc-900 dark:text-zinc-100">{filtered.reduce((s, o) => s + Number(o.total), 0).toLocaleString('ru-RU')} ₽</strong></span>
            </div>
          )}
          {/* Pagination */}
          {!loading && total > LIMIT && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                ← Назад
              </button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Стр. {page} из {Math.ceil(total / LIMIT)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / LIMIT)}
                className="px-3 py-1.5 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Редактировать заказ #{editingOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <button onClick={() => setEditingOrder(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Статус</label>
                <select
                  value={editingOrder.status}
                  onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {Object.entries(STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Delivery & Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Доставка</label>
                  <select
                    value={editingOrder.deliveryMethod || 'courier'}
                    onChange={e => setEditingOrder({ ...editingOrder, deliveryMethod: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="courier">Курьер</option>
                    <option value="pickup">Самовывоз</option>
                    <option value="post">Почта</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Оплата</label>
                  <select
                    value={editingOrder.paymentMethod || 'card'}
                    onChange={e => setEditingOrder({ ...editingOrder, paymentMethod: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="card">Карта</option>
                    <option value="cash">Наличные</option>
                    <option value="online">Онлайн</option>
                  </select>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Получатель</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['firstName', 'lastName', 'email', 'phone'] as const).map(field => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field === 'firstName' ? 'Имя' : field === 'lastName' ? 'Фамилия' : field === 'email' ? 'Email' : 'Телефон'}
                      value={editingOrder.recipient?.[field] || ''}
                      onChange={e => setEditingOrder({
                        ...editingOrder,
                        recipient: { ...editingOrder.recipient!, [field]: e.target.value }
                      })}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ))}
                  <input
                    type="text"
                    placeholder="Адрес доставки"
                    value={editingOrder.recipient?.address || ''}
                    onChange={e => setEditingOrder({
                      ...editingOrder,
                      recipient: { ...editingOrder.recipient!, address: e.target.value }
                    })}
                    className="col-span-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Комментарий</label>
                <textarea
                  value={editingOrder.comment || ''}
                  onChange={e => setEditingOrder({ ...editingOrder, comment: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Items (read-only) */}
              {editingOrder.items && editingOrder.items.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Товары</label>
                  <div className="space-y-2">
                    {editingOrder.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                          <p className="text-xs text-zinc-500">× {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {(Number(item.price) * item.quantity).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={saveOrder}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => deleteOrder(editingOrder.id)}
                className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
