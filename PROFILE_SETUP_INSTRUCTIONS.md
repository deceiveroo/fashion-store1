# Инструкции по настройке функционального профиля

## Шаг 1: Выполнить SQL скрипт

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Откройте файл `add-profile-features-tables.sql`
4. Скопируйте весь код и выполните в SQL Editor
5. Дождитесь сообщения "Profile features tables created successfully!"

## Шаг 2: Созданные API Endpoints

Все API endpoints уже созданы и готовы к использованию:

### ✅ `/api/profile/stats` - GET
Возвращает статистику пользователя для AI Assistant:
- Тренды по категориям
- Общие расходы
- Эко-статистика
- Последние покупки

### ✅ `/api/profile/wishlist` - GET, POST, DELETE
Управление вишлистом для подарков:
- GET: получить все товары в вишлисте
- POST: добавить товар, изменить видимость, обновить настройки
- DELETE: удалить товар

### ✅ `/api/profile/sessions` - GET, POST, DELETE
Управление сессиями:
- GET: получить активные сессии и историю входов
- POST: создать новую сессию
- DELETE: завершить сессию или все сессии

### ✅ `/api/profile/payments` - GET, POST, DELETE
Управление способами оплаты:
- GET: получить все способы оплаты
- POST: добавить карту, установить по умолчанию
- DELETE: удалить способ оплаты

### ✅ `/api/profile/notifications` - GET, POST
Настройки уведомлений:
- GET: получить настройки
- POST: обновить настройки

### ✅ `/api/profile/digital-twin` - GET, POST, DELETE
Цифровой двойник:
- GET: получить параметры тела и отслеживаемые товары
- POST: обновить параметры, добавить товар для отслеживания
- DELETE: удалить товар из отслеживания

### ✅ `/api/profile/export` - GET
GDPR экспорт данных:
- GET: скачать все данные пользователя в JSON

## Шаг 3: Обновление компонентов

Компоненты нужно обновить для использования реальных API:

### Компоненты, которые нужно обновить:

1. **AIStyleAssistant.tsx** - использовать `/api/profile/stats`
2. **EcoFootprint.tsx** - использовать `/api/profile/stats` (eco данные)
3. **DigitalTwin.tsx** - использовать `/api/profile/digital-twin`
4. **GiftWishlist.tsx** - использовать `/api/profile/wishlist`
5. **SecuritySettings.tsx** - использовать `/api/profile/sessions`
6. **PaymentMethods.tsx** - использовать `/api/profile/payments`
7. **NotificationSettings.tsx** - использовать `/api/profile/notifications`
8. **GDPRSettings.tsx** - использовать `/api/profile/export`

## Шаг 4: Тестирование

После выполнения SQL скрипта:

1. Войдите в аккаунт
2. Перейдите на `/profile`
3. Проверьте каждый компонент:
   - Account Health Dashboard - должен показывать реальный статус
   - AI Assistant - должен показывать реальные покупки
   - Eco Footprint - должен рассчитывать на основе заказов
   - Digital Twin - должен сохранять параметры
   - Gift Wishlist - должен добавлять/удалять товары
   - Security Settings - должен показывать реальные сессии
   - Payment Methods - должен добавлять/удалять карты
   - Notification Settings - должен сохранять настройки
   - GDPR - должен экспортировать данные

## Шаг 5: Что работает сейчас

### ✅ Уже функционально:
- Account Health Dashboard (использует данные из user_profiles)
- Основная информация профиля (имя, email, телефон, адрес)
- Смена пароля
- Загрузка аватара

### 🔄 Требует обновления компонентов:
- AI Style Assistant (API готов, нужно подключить)
- Eco Footprint (API готов, нужно подключить)
- Digital Twin (API готов, нужно подключить)
- Gift Wishlist (API готов, нужно подключить)
- Security Settings (API готов, нужно подключить)
- Payment Methods (API готов, нужно подключить)
- Notification Settings (API готов, нужно подключить)
- GDPR Settings (API готов, нужно подключить)

## Примеры использования API

### Получить статистику:
```typescript
const res = await fetch('/api/profile/stats', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
const data = await res.json();
// data.trends, data.totalSpent, data.eco, etc.
```

### Добавить в вишлист:
```typescript
await fetch('/api/profile/wishlist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'add_item',
    productId: 'uuid',
    isPublic: true,
    size: '42'
  })
});
```

### Завершить сессию:
```typescript
await fetch(`/api/profile/sessions?id=${sessionId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## Следующие шаги

1. ✅ Выполнить SQL скрипт
2. ✅ API endpoints созданы
3. 🔄 Обновить компоненты для использования API
4. 🔄 Протестировать все функции
5. 🔄 Добавить обработку ошибок
6. 🔄 Добавить loading states

## Заметки

- Все API endpoints защищены авторизацией
- Используется JWT токен или NextAuth сессия
- RLS политики настроены в базе данных
- Все данные пользователя изолированы
- GDPR compliance обеспечен

---

**Статус**: API готов, компоненты требуют обновления для подключения к API
