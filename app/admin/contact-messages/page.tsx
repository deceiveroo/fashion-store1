'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';

// Types for contact messages
interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  category: 'general' | 'order' | 'return' | 'complaint' | 'cooperation' | 'other';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string; // ISO string from API
  updatedAt: string;
  userId?: string;
  assignedTo?: string;
  repliedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Fetch contact messages from the API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/admin/contact-messages');
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          console.error('Failed to fetch contact messages');
        }
      } catch (error) {
        console.error('Error fetching contact messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Handle status update
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setMessages(messages.map(msg => 
          msg.id === id ? { ...msg, status: newStatus as any } : msg
        ));
        
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage({...selectedMessage, status: newStatus as any});
        }
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  // Format category for display
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'Общие вопросы';
      case 'order': return 'Заказы';
      case 'return': return 'Возврат';
      case 'complaint': return 'Жалобы';
      case 'cooperation': return 'Сотрудничество';
      case 'other': return 'Другое';
      default: return category;
    }
  };

  // Format status for display
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новое';
      case 'in_progress': return 'В работе';
      case 'resolved': return 'Решено';
      case 'closed': return 'Закрыто';
      default: return status;
    }
  };

  // Format priority for display
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'normal': return 'Нормальный';
      case 'high': return 'Высокий';
      case 'urgent': return 'Срочный';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="contact-messages">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="contact-messages">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Обращения через форму</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Сообщения с контактной формы</p>
        </div>
        
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Имя</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Тема</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Категория</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Статус</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Приоритет</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Дата создания</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200 dark:bg-zinc-900 dark:divide-zinc-800">
                {messages.map((message) => (
                  <tr 
                    key={message.id} 
                    className={message.status === 'new' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {message.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {message.firstName} {message.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {message.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {message.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        {getCategoryLabel(message.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        message.status === 'new' ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' : 
                        message.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' : 
                        message.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400'
                      }`}>
                        {getStatusLabel(message.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        message.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                        message.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {getPriorityLabel(message.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      <button 
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                        onClick={() => setSelectedMessage(message)}
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedMessage && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Детали обращения</h2>
              <button 
                className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
                onClick={() => setSelectedMessage(null)}
              >
                Закрыть
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Имя:</h3>
                <p className="text-zinc-900 dark:text-zinc-100">{selectedMessage.firstName} {selectedMessage.lastName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email:</h3>
                <p className="text-zinc-900 dark:text-zinc-100">{selectedMessage.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Тема:</h3>
                <p className="text-zinc-900 dark:text-zinc-100">{selectedMessage.subject}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Категория:</h3>
                <p className="text-zinc-900 dark:text-zinc-100">{getCategoryLabel(selectedMessage.category)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Статус:</h3>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => updateStatus(selectedMessage.id, e.target.value)}
                  className="mt-1 block w-full rounded-md border-zinc-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="new">Новое</option>
                  <option value="in_progress">В работе</option>
                  <option value="resolved">Решено</option>
                  <option value="closed">Закрыто</option>
                </select>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Приоритет:</h3>
                <p className="text-zinc-900 dark:text-zinc-100">{getPriorityLabel(selectedMessage.priority)}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Сообщение:</h3>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="whitespace-pre-line text-zinc-900 dark:text-zinc-100">{selectedMessage.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                onClick={() => setSelectedMessage(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}