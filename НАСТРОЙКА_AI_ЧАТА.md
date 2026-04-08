# Настройка AI для чата поддержки

## Проблема
AI не отвечает в чате поддержки - показывает только загрузку.

## Причины
1. Не настроены переменные окружения для Cloudflare AI
2. Неправильные учетные данные
3. Проблемы с API Cloudflare

## Решение

### 1. Получите учетные данные Cloudflare

1. Зайдите на https://dash.cloudflare.com/
2. Перейдите в раздел "AI" или "Workers AI"
3. Получите:
   - Account ID
   - API Token (с правами на Workers AI)

### 2. Добавьте в .env файл

```env
CLOUDFLARE_ACCOUNT_ID=ваш_account_id
CLOUDFLARE_API_TOKEN=ваш_api_token
```

### 3. Перезапустите сервер

```bash
npm run dev
```

## Проверка работы

1. Откройте сайт
2. Откройте чат поддержки
3. Отправьте сообщение "привет"
4. Проверьте консоль браузера (F12) на ошибки
5. Проверьте логи сервера

### Логи в консоли сервера:

Если AI работает:
```
[CHAT] Trying Cloudflare AI...
[CHAT] Cloudflare AI response: Привет! Чем могу помочь?
```

Если нет учетных данных:
```
[CHAT] Cloudflare credentials not found
[CHAT] Using fallback response
```

Если ошибка API:
```
[CHAT] Cloudflare AI error: ...
[CHAT] Using fallback response
```

## Fallback режим

Если Cloudflare AI не настроен, система использует встроенные ответы на основе ключевых слов:
- доставка
- возврат
- оплата
- размер
- заказ
- скидка

## Альтернативные решения

### Вариант 1: Использовать только fallback
Просто не настраивайте Cloudflare - система будет работать с базовыми ответами.

### Вариант 2: Подключить другой AI
Отредактируйте `app/api/chat/route.ts` и добавьте:
- OpenAI
- Anthropic Claude
- Google Gemini
- Groq

Пример для OpenAI:
```typescript
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Ты помощник магазина одежды ELEVATE...' },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
    }),
  });
  // ... обработка ответа
}
```

## Админ панель чата

### Функции:
1. **Просмотр всех чатов** - список активных, решённых и архивных чатов
2. **Взять под контроль** - отключить AI и отвечать вручную
3. **Завершить чат** - пометить как решённый
4. **Удалить чат** - полностью удалить сессию и сообщения

### Доступ:
`/admin/support-chats`

Требуется роль: `admin`

## Устранение проблем

### Чаты не загружаются
1. Проверьте авторизацию админа
2. Проверьте таблицы БД:
```sql
SELECT * FROM support_chat_sessions;
SELECT * FROM support_chat_messages;
```

### Сообщения не отправляются
1. Проверьте консоль браузера
2. Проверьте Network tab (F12)
3. Проверьте логи сервера

### AI не отвечает
1. Проверьте переменные окружения
2. Проверьте логи сервера
3. Проверьте квоты Cloudflare AI

## Тестирование

### 1. Тест пользовательского чата:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"привет","sessionId":"test-123"}'
```

### 2. Тест админ панели:
1. Войдите как админ
2. Откройте `/admin/support-chats`
3. Проверьте список чатов
4. Выберите чат
5. Отправьте сообщение

### 3. Тест взятия под контроль:
1. Создайте чат как пользователь
2. Войдите как админ
3. Нажмите "Взять под контроль"
4. Отправьте сообщение от админа
5. Проверьте, что AI больше не отвечает

## Мониторинг

### Проверка активных чатов:
```sql
SELECT 
  session_id,
  user_name,
  status,
  message_count,
  ai_disabled,
  taken_over_by,
  created_at
FROM support_chat_sessions
WHERE status = 'active'
ORDER BY last_message_at DESC;
```

### Статистика:
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(message_count) as avg_messages
FROM support_chat_sessions
GROUP BY status;
```
