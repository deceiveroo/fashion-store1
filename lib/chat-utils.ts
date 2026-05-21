/**
 * Chat System Utilities
 * Technical improvements for the support chat system
 */

// Rate limiting - prevents spam
const MESSAGE_RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();
const MAX_MESSAGES_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = MESSAGE_RATE_LIMIT.get(sessionId);

  if (!record || now > record.resetTime) {
    // Reset window
    MESSAGE_RATE_LIMIT.set(sessionId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_MESSAGES_PER_MINUTE - 1 };
  }

  if (record.count >= MAX_MESSAGES_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_MESSAGES_PER_MINUTE - record.count };
}

// Clean up old rate limit records (call periodically)
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [sessionId, record] of MESSAGE_RATE_LIMIT.entries()) {
    if (now > record.resetTime) {
      MESSAGE_RATE_LIMIT.delete(sessionId);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

// Session age checker - identifies stale sessions
export function isSessionStale(lastMessageAt: Date | null, maxAgeHours: number = 24): boolean {
  if (!lastMessageAt) return true;
  
  const now = new Date();
  const hoursSinceLastMessage = (now.getTime() - lastMessageAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastMessage > maxAgeHours;
}

// Calculate response time metrics
export function calculateResponseTime(messages: Array<{ sender: string; createdAt: Date }>): {
  avgResponseTime: number;
  totalResponses: number;
} {
  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1];
    const currMsg = messages[i];

    // Only measure user -> admin/ai responses
    if (prevMsg.sender === 'user' && (currMsg.sender === 'admin' || currMsg.sender === 'ai')) {
      const responseTime = currMsg.createdAt.getTime() - prevMsg.createdAt.getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  return {
    avgResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
    totalResponses: responseCount,
  };
}

// Format response time for display
export function formatResponseTime(ms: number): string {
  if (ms < 60000) {
    return `${Math.round(ms / 1000)} сек`;
  } else if (ms < 3600000) {
    return `${Math.round(ms / 60000)} мин`;
  } else {
    return `${Math.round(ms / 3600000)} ч`;
  }
}

// Debounce utility for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Validate message content
export function validateMessage(text: string, imageUrl: string | null): {
  valid: boolean;
  error?: string;
} {
  if (!text?.trim() && !imageUrl) {
    return { valid: false, error: 'Сообщение не может быть пустым' };
  }

  if (text && text.length > 2000) {
    return { valid: false, error: 'Сообщение слишком длинное (макс. 2000 символов)' };
  }

  // Validate image URL if provided
  if (imageUrl) {
    const urlValidation = validateImageUrl(imageUrl);
    if (!urlValidation.valid) {
      return urlValidation;
    }
  }

  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Сообщение содержит недопустимый контент' };
    }
  }

  return { valid: true };
}

// Validate and whitelist image URLs (SSRF protection)
export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'Разрешены только HTTPS ссылки' };
    }

    // Whitelist allowed domains
    const allowedDomains = [
      'supabase.co',
      'supabase.in',
      'cloudinary.com',
      'imgur.com',
      'i.imgur.com',
      'amazonaws.com',
      'storage.googleapis.com',
      'cdn.example.com', // Add your CDN domain here
    ];

    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(domain => hostname.endsWith(domain));

    if (!isAllowed) {
      return { 
        valid: false, 
        error: 'Домен изображения не в белом списке' 
      };
    }

    // Block internal/private IPs (additional SSRF protection)
    const ipPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/i;
    if (ipPattern.test(hostname)) {
      return { valid: false, error: 'Внутренние адреса запрещены' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Неверный формат URL' };
  }
}

// Generate unique message ID with timestamp for better sorting
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Heartbeat mechanism for Realtime connection
export class RealtimeHeartbeat {
  private intervalId: NodeJS.Timeout | null = null;
  private onHeartbeat?: () => void;
  private readonly interval: number;

  constructor(intervalMs: number = 30000, onHeartbeat?: () => void) {
    this.interval = intervalMs;
    this.onHeartbeat = onHeartbeat;
  }

  start() {
    this.stop(); // Clear existing
    this.intervalId = setInterval(() => {
      console.log('💓 Realtime heartbeat');
      this.onHeartbeat?.();
    }, this.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Connection status tracker
export class ConnectionTracker {
  private status: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private listeners: Array<(status: string) => void> = [];

  setStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  getStatus() {
    return this.status;
  }

  onStatusChange(callback: (status: string) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

// Message queue for offline support
export class MessageQueue {
  private queue: Array<{ text: string; imageUrl?: string; timestamp: number }> = [];

  add(message: { text: string; imageUrl?: string }) {
    this.queue.push({ ...message, timestamp: Date.now() });
    this.saveToStorage();
  }

  getPending() {
    return this.queue;
  }

  clear() {
    this.queue = [];
    this.removeFromStorage();
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_message_queue', JSON.stringify(this.queue));
    }
  }

  private removeFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chat_message_queue');
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat_message_queue');
      if (stored) {
        try {
          this.queue = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load message queue:', e);
        }
      }
    }
  }
}
