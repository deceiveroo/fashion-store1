# Срочные задачи для доработки

## 1. ✅ Orders Page - ГОТОВО
Создана новая улучшенная страница заказов с:
- Мега красивым дизайном с градиентами
- Фильтрами по статусам
- Раскрывающимися деталями заказов
- Анимациями Framer Motion
- Темной темой
- Кнопками действий (скачать чек, поддержка, отзыв)

## 2. 🔄 Checkout Page - ТРЕБУЕТ ОБНОВЛЕНИЯ
Текущая страница работает, но нужно улучшить:
- Добавить больше анимаций
- Улучшить UI/UX
- Добавить прогресс-бар оплаты
- Улучшить валидацию форм
- Добавить автозаполнение адресов

**Файл**: `app/checkout/page.tsx` (954 строки)

## 3. 📄 Privacy Policy & Terms - НУЖНО СОЗДАТЬ

### 3.1 Политика конфиденциальности
**Файл**: `app/privacy/page.tsx`
Должна содержать:
- Какие данные собираем
- Как используем данные
- Cookies и трекинг
- Права пользователей (GDPR)
- Контакты для вопросов

### 3.2 Условия использования
**Файл**: `app/terms/page.tsx`
Должна содержать:
- Правила использования сайта
- Ответственность сторон
- Возврат и обмен
- Гарантии
- Разрешение споров

### 3.3 Cookies Policy
**Файл**: `app/cookies/page.tsx`
Должна содержать:
- Что такое cookies
- Какие cookies используем
- Как управлять cookies
- Сторонние cookies

## 4. 💬 Support Chat - ТРЕБУЕТ ПОЛНОЙ ПЕРЕРАБОТКИ

### Текущие проблемы:
- ❌ Бот не отвечает
- ❌ Чаты не появляются в админке
- ❌ SSE не работает стабильно
- ❌ Telegram уведомления не приходят

### Что нужно сделать:
1. Проверить API `/api/chat/route.ts`
2. Проверить API `/api/chat/stream/route.ts`
3. Проверить API `/api/telegram/webhook/route.ts`
4. Проверить таблицы в БД (support_chats, chat_messages)
5. Проверить Telegram Bot Token
6. Переписать логику чата с нуля если нужно

### Новые функции для чата:
- ✨ Typing indicators
- ✨ Read receipts
- ✨ File attachments (не только изображения)
- ✨ Voice messages
- ✨ Chat history
- ✨ Emoji picker
- ✨ Quick replies
- ✨ Chat rating
- ✨ Transcript download

## 5. 🔧 Технические улучшения

### 5.1 Оптимизация производительности
- Lazy loading компонентов
- Image optimization
- Code splitting
- Caching strategies

### 5.2 SEO
- Meta tags для всех страниц
- Open Graph tags
- Structured data (JSON-LD)
- Sitemap.xml
- Robots.txt

### 5.3 Аналитика
- Google Analytics
- Yandex Metrika
- Conversion tracking
- Error tracking (Sentry)

## Приоритеты:

### Высокий приоритет:
1. ✅ Orders Page (ГОТОВО)
2. 💬 Support Chat (КРИТИЧНО - не работает)
3. 📄 Privacy/Terms/Cookies (нужно для GDPR)

### Средний приоритет:
4. 🔄 Checkout Page улучшения
5. 🔧 Технические улучшения

### Низкий приоритет:
6. SEO оптимизация
7. Аналитика

## Следующие шаги:

1. Создать Privacy Policy, Terms, Cookies страницы
2. Полностью переписать Support Chat
3. Улучшить Checkout Page
4. Протестировать все функции

---

**Статус**: Orders Page готова, остальное в работе
