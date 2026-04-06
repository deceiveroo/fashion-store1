# Установка Fashion Store

## Настройка окружения

1. Скопируйте файл `.env.example` в новый файл `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Отредактируйте файл `.env.local` и добавьте свои собственные значения переменных окружения:
   ```bash
   # Заполните свои значениями
   DATABASE_URL="postgresql://username:password@localhost:5432/fashion_store_db"
   DIRECT_URL="postgresql://username:password@localhost:5432/fashion_store_db"
   NEXTAUTH_SECRET="your_unique_secret_here"
   # и т.д.
   ```

## Установка зависимостей

```bash
npm install
```

## Запуск проекта

```bash
# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск в продакшен режиме
npm run start
```

## Миграция базы данных

```bash
# Генерация миграций
npm run db:generate

# Применение миграций
npm run db:push
```

## Доступ к админке

По умолчанию, учетные данные администратора:

- Admin: admin@fashionstore.com / AdminPass123!
- Manager: manager@fashionstore.com / ManagerPass123!
- Support: support@fashionstore.com / SupportPass123!

> **ВАЖНО**: Эти учетные данные только для начального использования. После первого входа рекомендуется изменить пароли.