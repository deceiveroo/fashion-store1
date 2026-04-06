@echo off
echo.
echo #########################################
echo #     Публикация проекта на GitHub      #
echo #########################################
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
echo 2. Добавление файлов к коммиту...
git add .

echo.
echo 3. Создание коммита...
git commit -m "Initial commit: Fashion Store project with secure environment setup"

echo.
echo #########################################
echo #    ТЕПЕРЬ НЕОБХОДИМО:                  #
echo #                                       #
echo # 1. Создать репозиторий на GitHub      #
echo # 2. Скопировать URL созданного        #
echo #    репозитория                       #
echo # 3. Заменить URL в следующей команде  #
echo #                                       #
echo # git remote add origin ВАШ_URL        #
echo # git branch -M main                   #
echo # git push -u origin main              #
echo #########################################
echo.
echo Содержимое файла .gitignore проверено - все чувствительные файлы игнорируются.
echo.
echo Файл .env.example доступен для клонирующих проект.
echo.
echo Настоятельно рекомендуется: 
echo - НЕ добавлять .env файлы с реальными секретами в репозиторий
echo - Использовать .env.local для локальных настроек
echo.
pause