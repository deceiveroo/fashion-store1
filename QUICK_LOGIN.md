# 🚀 Быстрый вход в админ панель

## 📋 Учетные данные

### Администратор:

```
URL:      http://localhost:3000/admin/login
Email:    admin@example.com
Пароль:   admin123
```

---

## ⚡ Быстрый старт

### 1. Инициализируйте БД (если еще не сделали):

Откройте Supabase SQL Editor и выполните `init-database.sql`

### 2. Запустите приложение:

```bash
npm run dev
```

### 3. Войдите:

```
http://localhost:3000/admin/login
```

---

## ⚠️ После первого входа:

1. Смените пароль
2. Обновите email на свой
3. Создайте дополнительных пользователей

---

## 🔧 Создание нового администратора:

```bash
# Сгенерируйте хеш пароля
node -e "console.log(require('bcryptjs').hashSync('ваш_пароль', 10))"

# Выполните в Supabase SQL Editor:
# INSERT INTO users (email, name, password, role) VALUES
#   ('ваш_email@example.com', 'Ваше Имя', 'хеш_пароля', 'admin');
```

---

**Готово!** 🎉

Подробности: см. `ADMIN_CREDENTIALS.md`
