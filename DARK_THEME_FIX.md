# ✅ Исправление темной темы в Tailwind CSS v4

## Проблема

После обновления на Tailwind CSS v4.0.7 переключение темной темы перестало работать.

## Причина

В Tailwind CSS v4 изменился подход к работе с темной темой:
- В v3 вариант `dark:` работал автоматически с классом `.dark`
- В v4 нужно явно настроить вариант `dark:` через директиву `@custom-variant`

## Решение

Добавлена директива `@custom-variant` в `app/globals.css`:

```css
@import "tailwindcss";

/* Настройка темной темы для ручного управления через класс .dark */
@custom-variant dark (&:where(.dark, .dark *));
```

### Что делает эта директива:

1. **`@custom-variant dark`** - определяет кастомный вариант для `dark:`
2. **`(&:where(.dark, .dark *))`** - указывает условие:
   - Применять стили когда у элемента есть класс `.dark`
   - ИЛИ когда у любого родителя есть класс `.dark`

## Как работает темная тема

### 1. ThemeProvider (next-themes)

В `components/providers/Providers.tsx`:

```tsx
<ThemeProvider 
  attribute="class" 
  defaultTheme="system" 
  enableSystem 
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

- `attribute="class"` - добавляет класс `.dark` к `<html>`
- `defaultTheme="system"` - по умолчанию следует системной теме
- `enableSystem` - разрешает использовать системную тему

### 2. Компонент переключения

В `components/admin/ThemeToggle.tsx`:

```tsx
const { theme, setTheme } = useTheme();

<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

### 3. CSS переменные

В `app/globals.css`:

```css
:root {
  /* Светлая тема */
  --background: #ffffff;
  --foreground: #0f172a;
}

.dark {
  /* Темная тема */
  --background: #0a0a0f;
  --foreground: #f1f5f9;
}
```

### 4. Использование в компонентах

```tsx
<div className="bg-white dark:bg-gray-950">
  <p className="text-gray-900 dark:text-gray-100">
    Текст меняет цвет в зависимости от темы
  </p>
</div>
```

## Проверка работы

### 1. Откройте приложение
```
http://localhost:3000
```

### 2. Найдите кнопку переключения темы
- В админке: правый верхний угол (иконка солнца/луны)
- На главной: в хедере

### 3. Нажмите на кнопку
- Должна переключиться тема
- Цвета должны измениться
- Иконка должна поменяться (солнце ↔ луна)

### 4. Проверьте в DevTools
```html
<!-- Светлая тема -->
<html lang="ru" class="">

<!-- Темная тема -->
<html lang="ru" class="dark">
```

### 5. Проверьте localStorage
```javascript
localStorage.getItem('theme')
// "light" или "dark" или "system"
```

## Расширенная настройка (опционально)

Если нужна поддержка атрибута `data-theme` вместо класса:

```css
@custom-variant dark {
  /* Ручной режим: тема "dark" */
  &:where([data-theme="dark"], [data-theme="dark"] *) {
    @slot;
  }
  
  /* Системный режим: следуем настройкам ОС */
  @media (prefers-color-scheme: dark) {
    &:where([data-theme="system"], [data-theme="system"] *) {
      @slot;
    }
  }
}
```

Тогда в ThemeProvider:

```tsx
<ThemeProvider attribute="data-theme" ...>
```

## Преимущества подхода v4

✅ **Гибкость** - можно настроить любую логику переключения
✅ **Производительность** - CSS-first подход быстрее
✅ **Контроль** - явная настройка вместо магии
✅ **Расширяемость** - легко добавить дополнительные темы

## Дополнительные темы (опционально)

Можно добавить больше тем:

```css
@custom-variant light (&:where(.light, .light *));
@custom-variant dark (&:where(.dark, .dark *));
@custom-variant sepia (&:where(.sepia, .sepia *));
```

Использование:

```tsx
<div className="bg-white dark:bg-gray-950 sepia:bg-amber-50">
  Поддержка трех тем!
</div>
```

## Итог

✅ Темная тема работает корректно
✅ Переключение через кнопку работает
✅ Системная тема поддерживается
✅ Все стили применяются правильно

---

**Проблема решена!** Темная тема полностью функциональна в Tailwind CSS v4.0.7.
