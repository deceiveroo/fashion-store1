#!/bin/bash

# 🚀 Скрипт автоматического обновления Next.js и React
# Использование: bash upgrade.sh

set -e  # Остановка при ошибке

echo "🚀 Начинаем обновление Next.js и React..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Проверка git
echo "📋 Шаг 1: Проверка git статуса..."
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  У вас есть несохраненные изменения!${NC}"
    echo "Сохраните изменения перед обновлением:"
    echo "  git add ."
    echo "  git commit -m 'Save before upgrade'"
    exit 1
fi
echo -e "${GREEN}✓ Git статус чистый${NC}"
echo ""

# 2. Создание ветки
echo "📋 Шаг 2: Создание ветки для обновления..."
BRANCH_NAME="upgrade-next-react-$(date +%Y%m%d)"
git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}✓ Создана ветка: $BRANCH_NAME${NC}"
echo ""

# 3. Бэкап package.json
echo "📋 Шаг 3: Создание бэкапа package.json..."
cp package.json package.json.backup
echo -e "${GREEN}✓ Бэкап создан: package.json.backup${NC}"
echo ""

# 4. Очистка
echo "📋 Шаг 4: Очистка кэша и node_modules..."
rm -rf .next node_modules package-lock.json
echo -e "${GREEN}✓ Кэш очищен${NC}"
echo ""

# 5. Обновление зависимостей
echo "📋 Шаг 5: Обновление зависимостей..."
echo "  - Next.js: 15.0.0 → 15.5.14"
echo "  - React: 19.0.0 → 19.2.0"
echo "  - React DOM: 19.0.0 → 19.2.0"
echo ""

npm install next@15.5.14 react@19.2.0 react-dom@19.2.0
npm install --save-dev @types/react@19 @types/react-dom@19

echo -e "${GREEN}✓ Основные зависимости обновлены${NC}"
echo ""

# 6. Обновление дополнительных библиотек
echo "📋 Шаг 6: Обновление дополнительных библиотек..."
npm install framer-motion@latest recharts@latest
echo -e "${GREEN}✓ Дополнительные библиотеки обновлены${NC}"
echo ""

# 7. Установка зависимостей
echo "📋 Шаг 7: Установка всех зависимостей..."
npm install
echo -e "${GREEN}✓ Зависимости установлены${NC}"
echo ""

# 8. Проверка TypeScript
echo "📋 Шаг 8: Проверка TypeScript..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ TypeScript проверка пройдена${NC}"
else
    echo -e "${RED}✗ Ошибки TypeScript обнаружены${NC}"
    echo "Проверьте ошибки выше и исправьте их"
fi
echo ""

# 9. Сборка проекта
echo "📋 Шаг 9: Сборка проекта..."
if npm run build; then
    echo -e "${GREEN}✓ Проект успешно собран${NC}"
else
    echo -e "${RED}✗ Ошибка сборки${NC}"
    echo ""
    echo "Откат изменений..."
    git checkout main
    git branch -D "$BRANCH_NAME"
    mv package.json.backup package.json
    npm install
    echo -e "${YELLOW}Изменения откачены. Проверьте ошибки и попробуйте снова.${NC}"
    exit 1
fi
echo ""

# 10. Коммит изменений
echo "📋 Шаг 10: Сохранение изменений..."
git add package.json package-lock.json
git commit -m "Upgrade: Next.js 15.5.14 + React 19.2.0"
echo -e "${GREEN}✓ Изменения сохранены${NC}"
echo ""

# Итоговая информация
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Обновление завершено успешно!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Обновленные версии:"
echo "  • Next.js: 15.5.14"
echo "  • React: 19.2.0"
echo "  • React DOM: 19.2.0"
echo ""
echo "🧪 Следующие шаги:"
echo "  1. Запустите dev сервер: npm run dev"
echo "  2. Протестируйте все страницы"
echo "  3. Проверьте консоль на ошибки"
echo "  4. Если все ОК: git checkout main && git merge $BRANCH_NAME"
echo "  5. Если проблемы: git checkout main && git branch -D $BRANCH_NAME"
echo ""
echo "📝 Бэкап сохранен в: package.json.backup"
echo ""
echo -e "${YELLOW}⚠️  Не забудьте протестировать:${NC}"
echo "  • Авторизацию"
echo "  • Создание/редактирование товаров"
echo "  • Оформление заказов"
echo "  • Дашборд и аналитику"
echo "  • Темную тему"
echo ""
