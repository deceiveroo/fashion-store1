/**
 * Typing Indicator Manager
 * Управление статусом "печатает" через Supabase Realtime
 */

import { RealtimeChannel } from '@supabase/supabase-js';

export class TypingIndicatorManager {
  private channel: RealtimeChannel | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  private isTyping = false;
  private userId: string;
  private sessionId: string;
  private onTypingChange?: (userId: string, isTyping: boolean) => void;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  /**
   * Инициализация подписки на typing events
   */
  initialize(supabase: any, onTypingChange?: (userId: string, isTyping: boolean) => void) {
    this.onTypingChange = onTypingChange;

    // Создаем канал для typing событий
    const channel = supabase.channel(`typing-${this.sessionId}`);
    this.channel = channel;

    // Подписываемся на broadcast события
    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { userId, isTyping } = payload.payload;
        
        // Игнорируем свои собственные события
        if (userId === this.userId) return;

        if (this.onTypingChange) {
          this.onTypingChange(userId, isTyping);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Typing indicator connected');
        }
      });

    return this;
  }

  /**
   * Отправить статус "печатает"
   */
  sendTypingStatus(isTyping: boolean) {
    if (!this.channel || this.isTyping === isTyping) return;

    this.isTyping = isTyping;

    this.channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: this.userId,
        isTyping,
        timestamp: Date.now(),
      },
    });

    // Автоматически сбрасываем статус через 3 секунды
    if (isTyping) {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      this.typingTimeout = setTimeout(() => {
        this.sendTypingStatus(false);
      }, 3000);
    }
  }

  /**
   * Debounced отправка typing статуса (для input events)
   */
  notifyTyping() {
    this.sendTypingStatus(true);
    
    // Сброс таймаута при каждом новом вводе
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.sendTypingStatus(false);
    }, 1000);
  }

  /**
   * Очистка ресурсов
   */
  cleanup() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.isTyping = false;
  }

  /**
   * Получить текущий статус
   */
  getIsTyping(): boolean {
    return this.isTyping;
  }
}

/**
 * Хук для использования typing indicator в React компонентах
 */
export function createTypingIndicator(
  supabase: any,
  sessionId: string,
  userId: string,
  onTypingChange?: (userId: string, isTyping: boolean) => void
) {
  const manager = new TypingIndicatorManager(sessionId, userId);
  manager.initialize(supabase, onTypingChange);
  
  return manager;
}
