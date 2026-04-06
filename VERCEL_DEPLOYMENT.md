# 🚀 Деплой на Vercel

Полное руководство по развертыванию Fashion Store на Vercel.

---

## 📋 Предварительные требования

### 1. Аккаунт Vercel
- Зарегистрируйтесь на https://vercel.com
- Подключите GitHub аккаунт

### 2. Git репозиторий
Проект должен быть в Git репозитории (GitHub, GitLab, или Bitbucket).

```bash
# Если еще не инициализирован Git
git init
git add .
git commit -m "Initial commit"

# Создайте репозиторий на GitHub и добавьте remote
git remote add origin https://github.com/ваш-username/fashion-store.git
git push -u origin main
```

### 3. База данных Supabase
У вас уже настроена Supabase БД - отлично! Нужны будут переменные окружения.

---

## 🔧 Шаг 1: Подготовка проекта

### 1.1 Проверьте package.json

Убедитесь, что есть build скрипт:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

✅ У вас уже есть эти скрипты.

### 1.2 Создайте .env.example

Создайте файл с примером переменных окружения (без реальных значений):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_PASSWORD=your_password

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_key_here

# Stripe (если используется)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 1.3 Проверьте .gitignore

Убедитесь, что `.env` файлы не попадут в Git:

```
.env
.env*.local
.env.production
```

✅ У вас уже настроен .gitignore.

---

## 🌐 Шаг 2: Деплой на Vercel

### Вариант A: Через Vercel Dashboard (рекомендуется)

#### 1. Импорт проекта

1. Откройте https://vercel.com/new
2. Выберите "Import Git Repository"
3. Выберите ваш репозиторий `fashion-store`
4. Нажмите "Import"

#### 2. Настройка проекта

Vercel автоматически определит Next.js проект.

**Framework Preset:** Next.js
**Root Directory:** ./
**Build Command:** `npm run build`
**Output Directory:** .next
**Install Command:** `npm install`

#### 3. Добавьте переменные окружения

Нажмите "Environment Variables" и добавьте:

```bash
# Database
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_PASSWORD=your_supabase_password

# NextAuth
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=generate_random_secret_here

# Node
NODE_ENV=production
NODE_TLS_REJECT_UNAUTHORIZED=0

# Optional: Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Как сгенерировать NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### 4. Деплой

Нажмите "Deploy" и ждите завершения сборки (~2-5 минут).

---

### Вариант B: Через Vercel CLI

#### 1. Установите Vercel CLI

```bash
npm install -g vercel
```

#### 2. Логин

```bash
vercel login
```

#### 3. Деплой

```bash
# Первый деплой
vercel

# Production деплой
vercel --prod
```

#### 4. Добавьте переменные окружения

```bash
vercel env add DATABASE_URL
vercel env add DATABASE_PASSWORD
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
```

---

## 🔐 Шаг 3: Настройка переменных окружения

### Обязательные переменные:

#### DATABASE_URL
Получите из Supabase:
1. Откройте проект в Supabase
2. Settings → Database → Connection string
3. Выберите "Connection pooling" (для Vercel)
4. Скопируйте URL

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### DATABASE_PASSWORD
Ваш пароль от Supabase БД.

#### NEXTAUTH_URL
URL вашего Vercel проекта:
```
https://your-project.vercel.app
```

#### NEXTAUTH_SECRET
Сгенерируйте случайную строку:
```bash
openssl rand -base64 32
# или
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Опциональные переменные:

#### Stripe (если используется)
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🎯 Шаг 4: Настройка домена (опционально)

### 1. Добавьте кастомный домен

В Vercel Dashboard:
1. Откройте ваш проект
2. Settings → Domains
3. Добавьте ваш домен (например: `fashionstore.com`)

### 2. Настройте DNS

Добавьте A или CNAME записи у вашего регистратора:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Обновите NEXTAUTH_URL

После настройки домена обновите переменную:
```
NEXTAUTH_URL=https://fashionstore.com
```

---

## ⚙️ Шаг 5: Оптимизация для Production

### 5.1 Настройте кеширование

Файл `vercel.json` уже создан с оптимальными настройками:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate=300"
        }
      ]
    }
  ]
}
```

### 5.2 Увеличьте TTL кеша для production

В `app/api/admin/analytics/route.ts` и `app/api/admin/stats/route.ts`:

```typescript
const CACHE_TTL = process.env.NODE_ENV === 'production' 
  ? 15 * 60 * 1000  // 15 минут в production
  : 5 * 60 * 1000;  // 5 минут в development
```

### 5.3 Настройте Supabase Connection Pooling

В Supabase обязательно используйте Connection Pooling для Vercel:

1. Supabase Dashboard → Settings → Database
2. Connection string → "Connection pooling"
3. Mode: "Transaction"
4. Используйте порт 6543 (не 5432)

---

## 🔍 Шаг 6: Проверка деплоя

### 1. Откройте сайт

```
https://your-project.vercel.app
```

### 2. Проверьте основные страницы

- ✅ Главная страница: `/`
- ✅ Админ панель: `/admin`
- ✅ Логин: `/admin/login`
- ✅ API: `/api/products`

### 3. Проверьте логи

В Vercel Dashboard:
1. Откройте проект
2. Deployments → Latest deployment
3. Functions → View logs

### 4. Проверьте базу данных

Убедитесь, что подключение к Supabase работает:
- Попробуйте залогиниться
- Проверьте загрузку продуктов
- Проверьте админ панель

---

## 🐛 Решение проблем

### Проблема 1: Build Failed

**Ошибка:** `Type error: ...`

**Решение:**
```bash
# Проверьте локально
npm run build

# Исправьте ошибки TypeScript
npm run lint
```

### Проблема 2: Database Connection Error

**Ошибка:** `Connection timeout` или `ECONNREFUSED`

**Решение:**
1. Проверьте DATABASE_URL (должен быть Connection Pooling URL)
2. Убедитесь, что используется порт 6543
3. Проверьте, что `pgbouncer=true` в URL
4. Добавьте `NODE_TLS_REJECT_UNAUTHORIZED=0` если нужно

### Проблема 3: NextAuth Error

**Ошибка:** `[next-auth][error][SIGNIN_OAUTH_ERROR]`

**Решение:**
1. Проверьте NEXTAUTH_URL (должен совпадать с доменом)
2. Проверьте NEXTAUTH_SECRET (должен быть установлен)
3. Убедитесь, что переменные добавлены в Production

### Проблема 4: Slow API Responses

**Решение:**
1. Используйте Connection Pooling в Supabase
2. Увеличьте TTL кеша до 15 минут
3. Добавьте индексы в БД
4. Рассмотрите использование Vercel Edge Functions

### Проблема 5: Environment Variables Not Working

**Решение:**
1. Убедитесь, что переменные добавлены для Production
2. Redeploy проект после добавления переменных
3. Проверьте, что нет опечаток в именах

---

## 📊 Мониторинг

### Vercel Analytics

Включите аналитику:
1. Project Settings → Analytics
2. Enable Analytics

### Vercel Speed Insights

Включите мониторинг производительности:
1. Project Settings → Speed Insights
2. Enable Speed Insights

### Логирование

Просмотр логов в реальном времени:
```bash
vercel logs your-project.vercel.app
```

---

## 🔄 Автоматический деплой

После первого деплоя Vercel автоматически:

✅ Деплоит при каждом push в main/master
✅ Создает preview для pull requests
✅ Запускает build checks
✅ Обновляет production при merge

### Настройка веток

В Project Settings → Git:
- **Production Branch:** `main` или `master`
- **Preview Branches:** все остальные

---

## 💡 Рекомендации

### 1. Используйте Preview Deployments

Для тестирования изменений:
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel создаст preview URL для тестирования.

### 2. Настройте защиту паролем

Для staging окружения:
1. Project Settings → Deployment Protection
2. Enable Password Protection

### 3. Используйте Edge Functions

Для критичных API endpoints:
```typescript
// app/api/products/route.ts
export const runtime = 'edge';
```

### 4. Оптимизируйте изображения

Используйте Next.js Image:
```tsx
import Image from 'next/image';

<Image 
  src="/product.jpg" 
  width={500} 
  height={500} 
  alt="Product"
/>
```

### 5. Настройте Redirects

В `next.config.ts`:
```typescript
async redirects() {
  return [
    {
      source: '/old-path',
      destination: '/new-path',
      permanent: true,
    },
  ];
}
```

---

## 📝 Чеклист перед деплоем

- [ ] Проект в Git репозитории
- [ ] `.env` файлы в `.gitignore`
- [ ] `npm run build` работает локально
- [ ] Все переменные окружения подготовлены
- [ ] Supabase Connection Pooling настроен
- [ ] NEXTAUTH_SECRET сгенерирован
- [ ] Тесты пройдены (если есть)
- [ ] TypeScript ошибки исправлены
- [ ] Изображения оптимизированы

---

## 🎉 Готово!

После успешного деплоя ваш сайт будет доступен по адресу:

```
https://your-project.vercel.app
```

### Следующие шаги:

1. ✅ Настройте кастомный домен
2. ✅ Включите аналитику
3. ✅ Настройте мониторинг
4. ✅ Добавьте SSL сертификат (автоматически)
5. ✅ Настройте CDN (автоматически)

---

## 📚 Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

**Удачи с деплоем!** 🚀

Если возникнут проблемы, проверьте логи в Vercel Dashboard или напишите в поддержку.
