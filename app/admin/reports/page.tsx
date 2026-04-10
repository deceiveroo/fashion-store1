'use client';

import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, TrendingUp, Package, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

interface ReportData { date: string; sales: number; orders: number; revenue: number; }

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('month');
  const [salesData, setSalesData] = useState<ReportData[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, iRes] = await Promise.all([
        fetch(`/api/admin/reports/sales?range=${range}`),
        fetch('/api/admin/reports/inventory'),
      ]);
      if (sRes.ok) setSalesData(await sRes.json());
      if (iRes.ok) setInventoryData(await iRes.json());
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range]);

  const exportCSV = (data: any[], filename: string, headers: Record<string, string>) => {
    if (!data.length) { toast.error('Нет данных'); return; }
    const keys = Object.keys(headers);
    const rows = [Object.values(headers).join(','), ...data.map(r => keys.map(k => r[k] ?? '').join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+rows], { type: 'text/csv;charset=utf-8;' }));
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Экспортировано');
  };

  const totalRevenue = salesData.reduce((s, x) => s + x.revenue, 0);
  const totalOrders = salesData.reduce((s, x) => s + x.orders, 0);
  const totalSales = salesData.reduce((s, x) => s + x.sales, 0);

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Отчёты</h1>
            <p className="text-sm text-white/40">Экспорт данных и аналитика</p>
          </div>
          <div className="flex gap-2">
            <select value={range} onChange={e => setRange(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none">
              {['week','month','quarter','year'].map(r => (
                <option key={r} value={r} className="bg-[#0f0f1a]">
                  {r === 'week' ? 'Неделя' : r === 'month' ? 'Месяц' : r === 'quarter' ? 'Квартал' : 'Год'}
                </option>
              ))}
            </select>
            <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Выручка', value: `${totalRevenue.toLocaleString('ru-RU')} ₽`, icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10' },
            { label: 'Заказов', value: totalOrders, icon: Package, color: 'text-blue-400 bg-blue-500/10' },
            { label: 'Продано', value: totalSales, icon: TrendingUp, color: 'text-violet-400 bg-violet-500/10' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs text-white/30 uppercase tracking-wider">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Export cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Продажи по дням', desc: 'Детальный отчёт за период',
              icon: TrendingUp, color: 'from-violet-500 to-indigo-600',
              onClick: () => exportCSV(salesData, 'sales', { date:'Дата', sales:'Продажи', orders:'Заказы', revenue:'Выручка' }),
              disabled: !salesData.length,
            },
            {
              title: 'Остатки склада', desc: 'Текущие остатки товаров',
              icon: Package, color: 'from-blue-500 to-cyan-600',
              onClick: () => exportCSV(inventoryData, 'inventory', { name:'Товар', sku:'SKU', stock:'Остаток', price:'Цена' }),
              disabled: !inventoryData.length,
            },
            {
              title: 'Налоговый отчёт', desc: 'НДС и чистая выручка',
              icon: DollarSign, color: 'from-emerald-500 to-teal-600',
              onClick: () => exportCSV(salesData.map(x => ({ date: x.date, revenue: x.revenue, vat: (x.revenue * 0.2).toFixed(2), net: (x.revenue * 0.8).toFixed(2) })), 'tax', { date:'Дата', revenue:'Выручка', vat:'НДС 20%', net:'Чистая' }),
              disabled: !salesData.length,
            },
          ].map(({ title, desc, icon: Icon, color, onClick, disabled }) => (
            <div key={title} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} mb-4`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-xs text-white/30">{desc}</p>
              <button onClick={onClick} disabled={disabled || loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                <Download className="h-3.5 w-3.5" />
                Экспорт CSV
              </button>
            </div>
          ))}
        </div>

        {/* Sales table */}
        {salesData.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Продажи по дням</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Дата','Продажи','Заказы','Выручка'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-white/60">{item.date}</td>
                      <td className="px-4 py-3 text-xs text-white/60">{item.sales}</td>
                      <td className="px-4 py-3 text-xs text-white/60">{item.orders}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-white text-right">{item.revenue.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
