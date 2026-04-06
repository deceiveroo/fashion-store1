// app/api/auth/[...nextauth]/route.ts
// В App Router Next.js 13+ маршруты аутентификации должны быть настроены по-другому
// Используем handlers из lib/auth.ts

import { handlers } from '@/lib/auth'; // Импортируем handlers из нашего auth.ts
export const { GET, POST } = handlers;