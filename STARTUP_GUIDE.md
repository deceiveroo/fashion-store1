# Запуск Fashion Store приложения

## Подготовка к запуску

1. Убедитесь, что у вас установлены:
   - Node.js (версия 18 или выше)
   - npm или yarn
   - PostgreSQL (локально или через Docker)

2. Установите зависимости:
   ```bash
   cd c:\Users\NIKITA\Desktop\1\fashion-store
   npm install
   ```

## Настройка переменных окружения

1. Создайте файл `.env.local` в корне проекта:
   ```bash
   cp .env.example .env.local
   ```

2. Отредактируйте файл `.env.local`, указав свои значения:
   ```
   # База данных (пример для локального PostgreSQL)
   DATABASE_URL="postgresql://username:password@localhost:5432/fashion_store"
   
   # NextAuth
   AUTH_SECRET="your-auth-secret"
   
   # FK Wallet (если используется)
   FKWALLET_ID=F7202469466394242
   FKWALLET_MERCHANT_NAME=ELEVATE
   FKWALLET_API_KEY="your_fk_wallet_api_key"
   FKWALLET_WEBHOOK_URL="https://yourdomain.com/api/wallet/webhook"
   
   # OpenAI API (если используется)
   OPENAI_API_KEY="your-openai-api-key"
   
   # Telegram Bot (используйте НОВЫЙ токен, не тот, что был в чате!)
   # ВАЖНО: токен 7966709872:AAEDTXblN3sPVFEv-afFd4S0FjlLOA4b4DM СКОМПРОМЕТИРОВАН
   # и НЕ ДОЛЖЕН использоваться. Создайте нового бота через @BotFather
   TELEGRAM_BOT_TOKEN="your-new-telegram-bot-token"
   ```

## Миграция базы данных

1. Выполните миграции:
   ```bash
   npx drizzle-kit push
   ```

2. Инициализируйте тестовые данные (если нужно):
   ```bash
   npm run dev
   # Затем откройте http://localhost:3000/api/init-demo
   ```

## Запуск приложения

1. Запустите в режиме разработки:
   ```bash
   npm run dev
   ```

2. Приложение будет доступно по адресу:
   - Основной сайт: http://localhost:3000
   - Админ-панель: http://localhost:3000/admin

3. Используйте учетные данные для входа в админ-панель:
   - Email: admin@fashionstore.com
   - Password: AdminPass123!

## Настройка Telegram-бота

1. Создайте нового бота через @BotFather в Telegram (НЕ используйте токен из чата!)
2. Добавьте токен в переменные окружения (см. выше)
3. После развертывания приложения на публичный URL, зарегистрируйте вебхук:
   ```bash
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/api/telegram/webhook", "allowed_updates": ["message", "callback_query"]}'
   ```

## Проверка функциональности

1. **AI Ассистент**: На любом экране сайта должна быть кнопка с роботом в правом нижнем углу
2. **Контактная форма**: Доступна по адресу http://localhost:3000/support/contact
3. **Управление обращениями**: В админ-панели появилась новая вкладка "Обращения"
4. **Telegram-бот**: При нажатии "Позвать оператора" в веб-чате, должно поступать уведомление в Telegram

## Важные замечания

- Если вы ранее использовали токен, который был в чате, его необходимо отозвать через @BotFather
- Для получения токена Telegram бота: найдите @BotFather в Telegram и создайте нового бота
- Убедитесь, что порт 3000 свободен, иначе Next.js автоматически выберет другой порт
- При первом запуске могут возникнуть ошибки, связанные с отсутствием данных в базе - это нормально
- Скомпрометированный токен `7966709872:AAEDTXblN3sPVFEv-afFd4S0FjlLOA4b4DM` НЕЛЬЗЯ использовать в продакшене