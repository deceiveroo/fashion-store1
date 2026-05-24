# 🛍️ Fashion Store - Интернет-магазин брендовой одежды

Полнофункциональный e-commerce проект с AI-ассистентом, геймификацией и множественными способами оплаты.

## 📋 Содержание

- [Особенности](#особенности)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Настройка окружения](#настройка-окружения)
- [Развертывание](#развертывание)
- [Документация](#документация)

## ✨ Особенности

### Для покупателей:
- 🛒 Полнофункциональный каталог товаров с фильтрацией
- 💳 Множественные способы оплаты (карты, криптовалюта, рассрочка, СБП)
- 🤖 AI-ассистент поддержки (OpenAI)
- 🎮 Система геймификации (уровни, достижения, награды)
- ⭐ Отзывы и рейтинги товаров
- 📦 Отслеживание заказов
- 🔔 Система уведомлений (email, push, SMS)
- ✅ Верификация пользователей

### Для администраторов:
- 📊 Полная административная панель
- 📈 Аналитика и отчеты
- 💬 Управление чатами поддержки
- 🏷️ Управление товарами и категориями
- 🎫 Система промокодов и акций
- 👥 Управление пользователями
- 📝 CMS для контента

## 🚀 Технологический стек

**Frontend:**
- Next.js 16.2.2 (App Router)
- React 19.2.0
- TypeScript 5
- Tailwind CSS 4.0.7
- Framer Motion (анимации)
- Zustand (state management)

**Backend:**
- Next.js API Routes
- NextAuth 5 (аутентификация)
- Drizzle ORM (работа с БД)
- PostgreSQL (Supabase)
- Upstash Redis (кэш, rate limiting)

**Интеграции:**
- OpenAI API (AI-чат)
- Stripe (платежи)
- Supabase Storage (файлы)
- Vercel Analytics

## 🏃 Быстрый старт

### Требования:
- Node.js 18+ 
- npm или yarn
- PostgreSQL база данных (Supabase)
- Upstash Redis (опционально, но рекомендуется)

### Установка:

1. **Клонируйте репозиторий:**
```bash
git clone <your-repo-url>
cd fashion-store1
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**
```bash
cp .env.example .env
```

Отредактируйте `.env` файл (см. [Настройка окружения](#настройка-окружения))

4. **Примените миграции БД:**
```bash
npm run db:push
```

5. **Заполните тестовыми данными (опционально):**
```bash
npm run seed
```

6. **Запустите dev сервер:**
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## ⚙️ Настройка окружения

### Обязательные переменные:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Encryption (для паспортных данных)
ENCRYPTION_KEY="your-32-byte-encryption-key-here"
```

### Рекомендуемые переменные:

```env
# Upstash Redis (для rate limiting и чата)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# OpenAI (для AI-чата)
OPENAI_API_KEY="sk-..."

# Stripe (для платежей)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Подробные инструкции:

- **Supabase:** [Создание проекта](https://supabase.com/docs/guides/getting-started)
- **Upstash Redis:** См. [SETUP_UPSTASH.md](./SETUP_UPSTASH.md)
- **OpenAI:** [Получить API ключ](https://platform.openai.com/api-keys)
- **Stripe:** [Получить ключи](https://dashboard.stripe.com/apikeys)

## Payment Methods

The store supports multiple payment methods including:

- Bank cards (Visa, Mastercard, МИР) via Stripe
- Fast Payment System (SBP) - Russian payment system
- Cryptocurrency payments (LTC, USDT TRC-20, TON, NOT)
- Online banking (СБП, Qiwi, ЮMoney)
- Cash on delivery
- Installments

To use Stripe payments, you need to configure your credentials in the environment variables (see [.env.example](./.env.example)).

For cryptocurrency payments, the system generates unique addresses for each order and monitors payments via blockchain monitoring services.

## Environment Variables Setup

### Required for Vercel Deployment

Add these variables in Vercel Dashboard → Settings → Environment Variables:

#### Redis (Upstash) - For Chat & Caching
```
UPSTASH_REDIS_REST_URL=<YOUR_UPSTASH_REDIS_REST_URL>
UPSTASH_REDIS_REST_TOKEN=<YOUR_UPSTASH_REDIS_REST_TOKEN>
```

**Important:** Select all environments (Production, Preview, Development)

Redis is used for:
- Real-time chat
- Rate limiting
- Data caching
- User sessions
- Offline message queue

Without Redis, chat and some features may not work correctly!


## 📦 Развертывание

### Развертывание на Vercel:

1. **Подключите GitHub репозиторий:**
   - Перейдите на [vercel.com](https://vercel.com)
   - Нажмите "New Project"
   - Импортируйте ваш GitHub репозиторий

2. **Настройте переменные окружения:**
   - В настройках проекта → Environment Variables
   - Добавьте все переменные из `.env`
   - Выберите все окружения (Production, Preview, Development)

3. **Deploy:**
   - Vercel автоматически задеплоит проект
   - Каждый push в main будет автоматически деплоиться

### Настройка Supabase:

1. **База данных уже настроена** (используется ваша текущая)
2. **Storage для изображений:**
   - Создайте bucket `products` для товаров
   - Создайте bucket `avatars` для аватаров
   - Настройте публичный доступ

### Настройка Upstash Redis:

См. подробную инструкцию в [SETUP_UPSTASH.md](./SETUP_UPSTASH.md)

## 📚 Документация

- **[АУДИТ_ПРОЕКТА.md](./АУДИТ_ПРОЕКТА.md)** - Полный аудит проекта
- **[SETUP_UPSTASH.md](./SETUP_UPSTASH.md)** - Настройка Redis
- **[VERIFICATION_SYSTEM.md](./VERIFICATION_SYSTEM.md)** - Система верификации
- **[SUPPORT_CHAT_IMPROVEMENTS.md](./SUPPORT_CHAT_IMPROVEMENTS.md)** - Чат поддержки

## 🛠️ Доступные команды

```bash
# Разработка
npm run dev              # Запуск dev сервера
npm run build            # Сборка для production
npm run start            # Запуск production сервера
npm run lint             # Проверка кода

# База данных
npm run db:generate      # Генерация миграций
npm run db:push          # Применение изменений в БД
npm run db:studio        # Открыть Drizzle Studio
npm run seed             # Заполнить БД тестовыми данными
npm run seed:staff       # Создать админ-аккаунты
```

## 🔐 Безопасность

### Перед production:

1. **Удалите debug эндпоинты:**
```bash
.\scripts\remove-debug-endpoints.ps1
```

2. **Настройте Upstash Redis** (обязательно для rate limiting)

3. **Сгенерируйте надежные ключи:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -base64 32
```

4. **Проверьте переменные окружения:**
   - Все секреты должны быть уникальными
   - Не используйте дефолтные значения
   - Не коммитьте `.env` файл

## 🎯 Основные функции

### Каталог товаров:
- Фильтрация по категориям, цене, размеру
- Поиск с подсказками
- Быстрый просмотр (Quick View)
- Избранное

### Корзина и оформление:
- Добавление товаров
- Применение промокодов
- Выбор доставки
- Множественные способы оплаты

### Административная панель:
- Управление товарами (CRUD)
- Управление заказами
- Аналитика и статистика
- Управление пользователями
- Чаты поддержки
- CMS для контента

### AI-чат поддержки:
- Автоматические ответы (OpenAI)
- Передача оператору
- История сообщений
- Оценка качества

### Геймификация:
- Система уровней и опыта
- Достижения
- Ежедневные квесты
- Магазин наград
- Таблица лидеров

## 🐛 Troubleshooting

### Проблема: База данных не подключается
**Решение:**
- Проверьте `DATABASE_URL` и `DIRECT_URL`
- Убедитесь что IP разрешен в Supabase
- Проверьте что БД запущена

### Проблема: Redis не работает
**Решение:**
- Проверьте переменные `UPSTASH_REDIS_*`
- Без Redis будет использоваться in-memory fallback
- См. [SETUP_UPSTASH.md](./SETUP_UPSTASH.md)

### Проблема: TypeScript ошибки
**Решение:**
```bash
npm run lint
# Исправьте ошибки или временно:
# В next.config.js установите ignoreBuildErrors: false
```

### Проблема: Изображения не загружаются
**Решение:**
- Проверьте Supabase Storage настройки
- Проверьте `NEXT_PUBLIC_SUPABASE_URL`
- Убедитесь что buckets созданы и публичны

## 📝 Лицензия

Этот проект создан для дипломной работы.

## 👨‍💻 Автор

Дипломный проект - Интернет-магазин брендовой одежды

## 🙏 Благодарности

- Next.js team
- Vercel
- Supabase
- OpenAI
- Все open-source библиотеки

---

**Версия:** 0.1.0  
**Последнее обновление:** Май 2026

