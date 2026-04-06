# 🚀 Быстрый деплой на Vercel

## За 5 минут

### 1. Подготовка (1 мин)

```bash
# Убедитесь что проект в Git
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Импорт в Vercel (2 мин)

1. Откройте https://vercel.com/new
2. Выберите ваш репозиторий
3. Нажмите "Import"

### 3. Переменные окружения (2 мин)

Добавьте в Vercel:

```bash
DATABASE_URL=ваш_supabase_connection_pooling_url
DATABASE_PASSWORD=ваш_supabase_password
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=сгенерируйте_командой_ниже
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Генерация NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Деплой

Нажмите "Deploy" и ждите ~3 минуты.

---

## ✅ Готово!

Ваш сайт доступен по адресу:
```
https://your-project.vercel.app
```

---

## 📚 Подробная инструкция

См. `VERCEL_DEPLOYMENT.md` для полного руководства.

---

## 🔧 После деплоя

1. Обновите NEXTAUTH_URL на реальный URL
2. Проверьте `/admin` и `/api/products`
3. Настройте кастомный домен (опционально)

---

**Готово!** 🎉
