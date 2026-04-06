# 🚀 Скрипт автоматического обновления Next.js и React (PowerShell)
# Использование: .\upgrade.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Начинаем обновление Next.js и React..." -ForegroundColor Cyan
Write-Host ""

# 1. Проверка git
Write-Host "📋 Шаг 1: Проверка git статуса..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  У вас есть несохраненные изменения!" -ForegroundColor Red
    Write-Host "Сохраните изменения перед обновлением:"
    Write-Host "  git add ."
    Write-Host "  git commit -m 'Save before upgrade'"
    exit 1
}
Write-Host "✓ Git статус чистый" -ForegroundColor Green
Write-Host ""

# 2. Создание ветки
Write-Host "📋 Шаг 2: Создание ветки для обновления..." -ForegroundColor Yellow
$branchName = "upgrade-next-react-$(Get-Date -Format 'yyyyMMdd')"
git checkout -b $branchName
Write-Host "✓ Создана ветка: $branchName" -ForegroundColor Green
Write-Host ""

# 3. Бэкап package.json
Write-Host "📋 Шаг 3: Создание бэкапа package.json..." -ForegroundColor Yellow
Copy-Item package.json package.json.backup
Write-Host "✓ Бэкап создан: package.json.backup" -ForegroundColor Green
Write-Host ""

# 4. Очистка
Write-Host "📋 Шаг 4: Очистка кэша и node_modules..." -ForegroundColor Yellow
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
Write-Host "✓ Кэш очищен" -ForegroundColor Green
Write-Host ""

# 5. Обновление зависимостей
Write-Host "📋 Шаг 5: Обновление зависимостей..." -ForegroundColor Yellow
Write-Host "  - Next.js: 15.0.0 → 15.5.14"
Write-Host "  - React: 19.0.0 → 19.2.0"
Write-Host "  - React DOM: 19.0.0 → 19.2.0"
Write-Host ""

npm install next@15.5.14 react@19.2.0 react-dom@19.2.0
npm install --save-dev "@types/react@19" "@types/react-dom@19"

Write-Host "✓ Основные зависимости обновлены" -ForegroundColor Green
Write-Host ""

# 6. Обновление дополнительных библиотек
Write-Host "📋 Шаг 6: Обновление дополнительных библиотек..." -ForegroundColor Yellow
npm install framer-motion@latest recharts@latest
Write-Host "✓ Дополнительные библиотеки обновлены" -ForegroundColor Green
Write-Host ""

# 7. Установка зависимостей
Write-Host "📋 Шаг 7: Установка всех зависимостей..." -ForegroundColor Yellow
npm install
Write-Host "✓ Зависимости установлены" -ForegroundColor Green
Write-Host ""

# 8. Проверка TypeScript
Write-Host "📋 Шаг 8: Проверка TypeScript..." -ForegroundColor Yellow
try {
    npx tsc --noEmit
    Write-Host "✓ TypeScript проверка пройдена" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибки TypeScript обнаружены" -ForegroundColor Red
    Write-Host "Проверьте ошибки выше и исправьте их"
}
Write-Host ""

# 9. Сборка проекта
Write-Host "📋 Шаг 9: Сборка проекта..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✓ Проект успешно собран" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка сборки" -ForegroundColor Red
    Write-Host ""
    Write-Host "Откат изменений..." -ForegroundColor Yellow
    git checkout main
    git branch -D $branchName
    Move-Item -Force package.json.backup package.json
    npm install
    Write-Host "Изменения откачены. Проверьте ошибки и попробуйте снова." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 10. Коммит изменений
Write-Host "📋 Шаг 10: Сохранение изменений..." -ForegroundColor Yellow
git add package.json package-lock.json
git commit -m "Upgrade: Next.js 15.5.14 + React 19.2.0"
Write-Host "✓ Изменения сохранены" -ForegroundColor Green
Write-Host ""

# Итоговая информация
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Обновление завершено успешно!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Обновленные версии:"
Write-Host "  • Next.js: 15.5.14"
Write-Host "  • React: 19.2.0"
Write-Host "  • React DOM: 19.2.0"
Write-Host ""
Write-Host "🧪 Следующие шаги:"
Write-Host "  1. Запустите dev сервер: npm run dev"
Write-Host "  2. Протестируйте все страницы"
Write-Host "  3. Проверьте консоль на ошибки"
Write-Host "  4. Если все ОК: git checkout main; git merge $branchName"
Write-Host "  5. Если проблемы: git checkout main; git branch -D $branchName"
Write-Host ""
Write-Host "📝 Бэкап сохранен в: package.json.backup"
Write-Host ""
Write-Host "⚠️  Не забудьте протестировать:" -ForegroundColor Yellow
Write-Host "  • Авторизацию"
Write-Host "  • Создание/редактирование товаров"
Write-Host "  • Оформление заказов"
Write-Host "  • Дашборд и аналитику"
Write-Host "  • Темную тему"
Write-Host ""
