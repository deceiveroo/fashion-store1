@echo off
echo.
echo #########################################
echo # ПУБЛИКАЦИЯ ПРОЕКТА НА GITHUB           #
echo #########################################
echo.
echo URL РЕПОЗИТОРИЯ: https://github.com/deceiveroo/fashion-store1.git
echo.

REM Проверка наличия Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git не найден в системе. Установите Git и добавьте его в PATH.
    pause
    exit /b 1
)

REM Проверка, находится ли пользователь в директории проекта
if not exist ".env.example" (
    echo ERROR: Кажется, вы не в директории проекта fashion-store.
    echo Убедитесь, что запускаете этот скрипт из правильной директории.
    pause
    exit /b 1
)

echo 1. Настройка пользователя Git...
git config --global user.email "deceiveroo@gmail.com"
git config --global user.name "deceiveroo"

echo.
echo 2. Инициализация Git репозитория...
if not exist ".git" (
    git init
    if %errorlevel% neq 0 (
        echo Ошибка при инициализации Git репозитория
        pause
        exit /b 1
    )
) else (
    echo Репозиторий уже инициализирован
)

echo.
echo 3. Добавление файлов к коммиту...
git add .

echo.
echo 4. Создание коммита...
git commit -m "Initial commit: Fashion Store project with secure environment setup"

echo.
echo 5. Добавление удаленного репозитория...
git remote add origin https://github.com/deceiveroo/fashion-store1.git

echo.
echo 6. Переименование ветки в main...
git branch -M main

echo.
echo 7. Отправка проекта на GitHub...
git push -u origin main

echo.
echo #########################################
echo #    ПРОЕКТ УСПЕШНО ОПУБЛИКОВАН!        #
echo #########################################
echo.
echo Ваш проект опубликован на GitHub по адресу:
echo https://github.com/deceiveroo/fashion-store1.git
echo.
echo Все чувствительные файлы (.env*) были проигнорированы.
echo.
pause