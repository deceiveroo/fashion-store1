'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
}

export default function SupportCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, search]);

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        toast.error('Не удалось загрузить клиентов');
        return;
      }
      
      const data = await res.json();
      const customersList = Array.isArray(data) ? data : (data.customers || []);
      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!search) {
      setFilteredCustomers(customers);
      return;
    }

    const q = search.toLowerCase();
    const filtered = customers.filter(c => 
      (c.firstName || '').toLowerCase().includes(q) ||
      (c.lastName || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
    
    setFilteredCustomers(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Клиенты</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Поиск и просмотр информации о клиентах</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по имени, email или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customers List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Users className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">Клиенты не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-lg">
                        {(customer.firstName || customer.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {customer.firstName && customer.lastName
                            ? `${customer.firstName} ${customer.lastName}`
                            : 'Пользователь'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {customer.id.slice(0, 8)}...</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(customer.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Всего клиентов: {filteredCustomers.length}
        </div>
      )}
    </div>
  );
}
