/**
 * Offline Message Queue
 * Очередь сообщений для работы офлайн через IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineMessage {
  id: string;
  sessionId: string;
  text: string;
  imageUrl?: string | null;
  timestamp: number;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  error?: string;
}

interface ChatDB extends DBSchema {
  offlineQueue: {
    key: string;
    value: OfflineMessage;
    indexes: {
      'by-session': string;
      'by-status': string;
      'by-timestamp': number;
    };
  };
}

const DB_NAME = 'chat-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'offlineQueue';

class OfflineMessageQueue {
  private db: IDBPDatabase<ChatDB> | null = null;
  private syncInProgress = false;
  private onSyncComplete?: () => void;

  /**
   * Инициализация базы данных
   */
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<ChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase<ChatDB>) {
        // Создаем хранилище если не существует
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Индексы для эффективного поиска
          store.createIndex('by-session', 'sessionId');
          store.createIndex('by-status', 'status');
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });

    console.log('✅ Offline queue initialized');
  }

  /**
   * Добавить сообщение в очередь
   */
  async addMessage(message: Omit<OfflineMessage, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    await this.init();

    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const offlineMsg: OfflineMessage = {
      ...message,
      id,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await this.db!.add(STORE_NAME, offlineMsg);
    console.log('📝 Message added to offline queue:', id);

    // Пытаемся отправить если онлайн
    if (navigator.onLine) {
      this.syncQueue();
    }

    return id;
  }

  /**
   * Получить все ожидающие сообщения
   */
  async getPendingMessages(sessionId?: string): Promise<OfflineMessage[]> {
    await this.init();

    if (sessionId) {
      return await this.db!.getAllFromIndex(STORE_NAME, 'by-session', sessionId);
    }

    return await this.db!.getAllFromIndex(STORE_NAME, 'by-status', 'pending');
  }

  /**
   * Пометить сообщение как отправленное
   */
  async markAsSent(id: string): Promise<void> {
    await this.init();

    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const msg = await store.get(id);

    if (msg) {
      msg.status = 'sent';
      await store.put(msg);
    }

    await tx.done;
    console.log('✅ Message marked as sent:', id);
  }

  /**
   * Пометить сообщение как failed
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    await this.init();

    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const msg = await store.get(id);

    if (msg) {
      msg.status = 'failed';
      msg.error = error;
      msg.retryCount += 1;
      await store.put(msg);
    }

    await tx.done;
    console.log('❌ Message marked as failed:', id);
  }

  /**
   * Удалить сообщение из очереди
   */
  async deleteMessage(id: string): Promise<void> {
    await this.init();
    await this.db!.delete(STORE_NAME, id);
    console.log('🗑️ Message deleted from queue:', id);
  }

  /**
   * Очистить всю очередь для сессии
   */
  async clearSession(sessionId: string): Promise<void> {
    await this.init();

    const messages = await this.getPendingMessages(sessionId);
    const tx = this.db!.transaction(STORE_NAME, 'readwrite');

    for (const msg of messages) {
      await tx.objectStore(STORE_NAME).delete(msg.id);
    }

    await tx.done;
    console.log('🧹 Session queue cleared:', sessionId);
  }

  /**
   * Синхронизация очереди с сервером
   */
  async syncQueue(onComplete?: () => void): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    this.onSyncComplete = onComplete;

    try {
      const pendingMessages = await this.getPendingMessages();

      if (pendingMessages.length === 0) {
        console.log('✓ No pending messages to sync');
        this.syncInProgress = false;
        this.onSyncComplete?.();
        return;
      }

      console.log(`🔄 Syncing ${pendingMessages.length} offline messages...`);

      // Отправляем сообщения по порядку
      for (const msg of pendingMessages) {
        try {
          await this.sendMessageToServer(msg);
          await this.markAsSent(msg.id);
        } catch (error) {
          console.error(`Failed to send message ${msg.id}:`, error);
          await this.markAsFailed(msg.id, String(error));
        }
      }

      console.log('✅ Sync complete');
      this.onSyncComplete?.();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Отправить сообщение на сервер
   */
  private async sendMessageToServer(msg: OfflineMessage): Promise<void> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg.text,
        sessionId: msg.sessionId,
        imageUrl: msg.imageUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const data = await response.json();
    
    // Если есть авто-ответ, сохраняем его
    if (data.autoReply) {
      // Авто-ответ будет получен через realtime или polling
      console.log('Auto-reply received for offline message');
    }
  }

  /**
   * Получить количество сообщений в очереди
   */
  async getQueueSize(sessionId?: string): Promise<number> {
    await this.init();

    if (sessionId) {
      const messages = await this.getPendingMessages(sessionId);
      return messages.length;
    }

    const allPending = await this.db!.getAllFromIndex(STORE_NAME, 'by-status', 'pending');
    return allPending.length;
  }

  /**
   * Проверить есть ли сообщения в очереди
   */
  async hasPendingMessages(sessionId?: string): Promise<boolean> {
    const size = await this.getQueueSize(sessionId);
    return size > 0;
  }

  /**
   * Слушатель изменения статуса сети
   */
  setupNetworkListener(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Network online, syncing queue...');
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network offline, messages will be queued');
    });
  }

  /**
   * Закрыть соединение с БД
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('🔒 Offline queue closed');
    }
  }
}

// Singleton instance
let offlineQueueInstance: OfflineMessageQueue | null = null;

export function getOfflineQueue(): OfflineMessageQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineMessageQueue();
  }
  return offlineQueueInstance;
}

export type { OfflineMessage };
