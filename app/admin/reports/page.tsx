'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Download, FileSpreadsheet, TrendingUp, Package, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ReportData {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [salesData, setSalesData] = useState<ReportData[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      // Загрузка данных о продажах
      const response = await fetch(`/api/admin/reports/sales?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      }

      // Загрузка данных о складе
      const invResponse = await fetch('/api/admin/reports/inventory');
      if (invResponse.ok) {
        const invData = await invResponse.json();
        setInventoryData(invData);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Отчёт экспортирован');
  };

  const exportSalesReport = () => {
    const formattedData = salesData.map(item => ({
      'Дата': item.date,
      'Продажи': item.sales,
      'Заказы': item.orders,
      'Выручка': item.revenue,
    }));
    exportToCSV(formattedData, 'sales_report');
  };

  const exportInventoryReport = () => {
    const formattedData = inventoryData.map(item => ({
      'Товар': item.name,
      'SKU': item.sku || 'N/A',
      'Остаток': item.stock,
      'Цена': item.price,
      'Статус': item.inStock ? 'В наличии' : 'Нет в наличии',
    }));
    exportToCSV(formattedData, 'inventory_report');
  };

  const exportTaxReport = () => {
    const taxData = salesData.map(item => ({
      'Дата': item.date,
      'Выручка': item.revenue,
      'НДС (20%)': (item.revenue * 0.2).toFixed(2),
      'Чистая выручка': (item.revenue * 0.8).toFixed(2),
    }));
    exportToCSV(taxData, 'tax_report');
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);

  return (
    <AdminLayout currentPage="reports">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
              Отчёты
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Экспорт данных и аналитика продаж
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-lg dark:border-zinc-800 dark:from-violet-950/30 dark:to-purple-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Общая выручка</p>
                <p className="mt-2 text-3xl font-bold text-violet-700 dark:text-violet-400">
                  {totalRevenue.toLocaleString('ru-RU')} ₽
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg dark:border-zinc-800 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Всего заказов</p>
                <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-400">{totalOrders}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg dark:border-zinc-800 dark:from-green-950/30 dark:to-emerald-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Продано товаров</p>
                <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-400">{totalSales}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Export Reports */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Sales Report */}
          <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg">
              <TrendingUp className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Продажи по дням</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Детальный отчёт о продажах за выбранный период
            </p>
            <button
              onClick={exportSalesReport}
              disabled={loading || salesData.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Экспорт CSV
            </button>
          </div>

          {/* Inventory Report */}
          <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Остатки склада</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Текущие остатки товаров на складе
            </p>
            <button
              onClick={exportInventoryReport}
              disabled={loading || inventoryData.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Экспорт CSV
            </button>
          </div>

          {/* Tax Report */}
          <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg">
              <DollarSign className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Налоговый отчёт</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Расчёт НДС и чистой выручки
            </p>
            <button
              onClick={exportTaxReport}
              disabled={loading || salesData.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              Экспорт CSV
            </button>
          </div>
        </div>

        {/* Sales Table */}
        {salesData.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold">Продажи по дням</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="pb-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Дата</th>
                    <th className="pb-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">Продажи</th>
                    <th className="pb-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">Заказы</th>
                    <th className="pb-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800/50">
                      <td className="py-3 text-sm">{item.date}</td>
                      <td className="py-3 text-right text-sm">{item.sales}</td>
                      <td className="py-3 text-right text-sm">{item.orders}</td>
                      <td className="py-3 text-right text-sm font-medium">{item.revenue.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
