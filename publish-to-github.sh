#!/bin/bash

# Скрипт для обновления репозитория на GitHub

echo "Обновление Fashion Store на GitHub"
echo "=================================="

# Проверяем наличие git
if ! command -v git &> /dev/null; then
    echo "Ошибка: Git не установлен"
    exit 1
fi

# Проверяем, находится ли папка в репозитории git
if [ ! -d ".git" ]; then
    echo "Инициализация нового репозитория Git..."
    git init
    
    # Добавляем все файлы
    echo "Добавление файлов в репозиторий..."
    git add .
    
    # Создаем первый коммит
    echo "Создание первого коммита..."
    git commit -m "Initial commit: Fashion Store - Next.js e-commerce platform with multiple payment methods"
else
    echo "Обнаружен существующий .git каталог."
fi

# Проверяем, что чувствительные файлы указаны в .gitignore
echo ""
echo "Проверка файлов .env в .gitignore..."
if grep -q "\.env\*" .gitignore; then
    echo "✓ Файлы .env* находятся в .gitignore"
else
    echo "⚠️  Файлы .env* НЕ найдены в .gitignore! Добавьте '.env*' в .gitignore перед публикацией!"
fi

# Проверяем наличие файла с рекомендациями по безопасности
if [ -f "SECURITY_CONSIDERATIONS.md" ]; then
    echo "✓ Файл SECURITY_CONSIDERATIONS.md найден"
else
    echo "⚠️  Файл SECURITY_CONSIDERATIONS.md отсутствует!"
fi

# Инструкции для пользователя
echo ""
echo "Теперь выполните следующие шаги для обновления репозитория:"
echo "1. Если вы еще не установили удаленный репозиторий, выполните (замените URL на ваш):"
echo "   git remote add origin https://github.com/deceiveroo/fashion-store1.git"
echo ""
echo "2. Переключитесь на ветку main (если она существует):"
echo "   git checkout main"
echo ""
echo "3. Обновите все файлы для публикации"
echo ""
echo "4. Добавьте изменения:"
echo "   git add ."
echo ""
echo "5. Сделайте коммит:"
echo "   git commit -m \"Update: Full project files for fashion store\""
echo ""
echo "6. Загрузите изменения на GitHub:"
echo "   git push -u origin main --force"
echo ""
echo "ВАЖНО: Перед публикацией убедитесь, что:"
echo "- Все чувствительные данные находятся в .env* файлах"
echo "- Эти файлы НЕ попадают в репозиторий (они должны быть в .gitignore)"
echo "- В репозиторий НЕ попадает информация о базе данных, ключах API и паролях"
echo "- Прочитайте файл SECURITY_CONSIDERATIONS.md для дополнительной информации"
echo ""
echo "Проект готов к обновлению на GitHub!"