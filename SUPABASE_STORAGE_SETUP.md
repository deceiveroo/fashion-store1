# Инструкция по настройке Supabase Storage для загрузки фото

## Проблема: Фото не отображаются и нельзя загружать

### Причина:
Bucket `uploads` в Supabase не создан или не настроен правильно.

## Решение: Настройка через Supabase Dashboard

### Шаг 1: Создание Bucket

1. **Откройте Supabase Dashboard:**
   - Перейдите на https://app.supabase.com
   - Выберите ваш проект (mgprrbrevhzsvgizypov)

2. **Перейдите в Storage:**
   - В левой панели нажмите **Storage**
   - Нажмите кнопку **New bucket**

3. **Создайте bucket:**
   - **Name:** `uploads`
   - **Public bucket:** ✅ ВКЛЮЧИТЬ (это важно!)
   - Нажмите **Create bucket**

### Шаг 2: Настройка прав доступа (RLS Policies)

1. **В разделе Storage нажмите на bucket `uploads`**

2. **Перейдите во вкладку "Policies"**

3. **Добавьте следующие policies:**

   #### Policy 1: Public Read (чтение для всех)
   - Нажмите **New policy**
   - Выберите **For full customization**
   - Заполните:
     ```
     Policy name: Public Read
     Allowed operation: SELECT
     Target roles: anon, authenticated
     USING expression: true
     ```
   - Нажмите **Review** → **Save policy**

   #### Policy 2: Authenticated Upload (загрузка для авторизованных)
   - Нажмите **New policy**
   - Выберите **For full customization**
   - Заполните:
     ```
     Policy name: Authenticated Upload
     Allowed operation: INSERT
     Target roles: authenticated
     WITH CHECK expression: auth.role() = 'authenticated'
     ```
   - Нажмите **Review** → **Save policy**

   #### Policy 3: Owner Update/Delete (изменение/удаление владельцем)
   - Нажмите **New policy**
   - Выберите **For full customization**
   - Заполните:
     ```
     Policy name: Owner Update/Delete
     Allowed operation: UPDATE, DELETE
     Target roles: authenticated
     USING expression: auth.uid()::text = (storage.foldername(name))[1]
     WITH CHECK expression: auth.uid()::text = (storage.foldername(name))[1]
     ```
   - Нажмите **Review** → **Save policy**

### Шаг 3: Проверка работы

1. **Перезапустите dev сервер:**
   ```bash
   npm run dev
   ```

2. **Проверьте загрузку аватара:**
   - Войдите на сайт
   - Перейдите в профиль
   - Попробуйте загрузить аватар

3. **Проверьте отображение фото товаров:**
   - Откройте страницу товара
   - Фото должны отображаться корректно

## 🔧 Альтернативный способ: Через SQL Editor

Если UI не работает, выполните этот SQL в **SQL Editor**:

```sql
-- Create uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public read
CREATE POLICY "Public Read" ON storage.objects
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Authenticated upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Owner update/delete
CREATE POLICY "Owner Update/Delete" ON storage.objects
FOR UPDATE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner Delete" ON storage.objects
FOR DELETE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 📝 Важные моменты

### URL формата изображений:
- Публичные фото: `https://mgprrbrevhzsvgizypov.supabase.co/storage/v1/object/public/uploads/filename.jpg`
- Локально: `/uploads/filename.jpg` (проксируется через Next.js)

### Структура папок в bucket:
```
uploads/
├── avatars/          # Аватары пользователей
│   └── user-id.jpg
├── products/         # Фото товаров
│   └── product-id.jpg
├── chat/            # Фото из чата
│   └── message-id.jpg
└── other/           # Другие файлы
```

### Если фото всё ещё не работают:

1. **Проверьте Console браузера** на ошибки CORS
2. **Убедитесь что bucket public** (галочка включена)
3. **Проверьте RLS policies** - они должны быть активны
4. **Очистите кэш браузера** (Ctrl+Shift+Delete)

## ✅ Проверка успешной настройки

После настройки вы должны:
- ✅ Видеть существующие фото товаров
- ✅ Загружать аватар в профиле
- ✅ Загружать фото в чате поддержки
- ✅ Видеть загруженные фото сразу после загрузки
