@echo off
echo.
echo #########################################
echo # ИСПРАВЛЕННАЯ ПУБЛИКАЦИЯ НА GITHUB      #
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

REM Настройка пользователя Git
git config --global user.email "deceiveroo@gmail.com"
git config --global user.name "deceiveroo"

echo 1. Инициализация Git репозитория...
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
echo 2. Добавление файлов к коммиту (исключая nul)...
git add --all
git rm --cached nul 2>nul

echo.
echo 3. Создание коммита...
git commit -m "Initial commit: Fashion Store project with secure environment setup"

echo.
echo 4. Добавление удаленного репозитория...
git remote add origin https://github.com/deceiveroo/fashion-store1.git

echo.
echo 5. Переименование ветки в main...
git branch -M main

echo.
echo 6. Отправка проекта на GitHub...
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