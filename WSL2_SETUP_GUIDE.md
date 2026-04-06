# Руководство по настройке WSL2 для проекта Fashion Store

## Почему WSL2?

Tailwind CSS v4 + Next.js 16 (Turbopack) имеет известный баг на Windows, связанный с файлом "nul". WSL2 полностью решает эту проблему, предоставляя Linux-окружение с отличной производительностью.

## Преимущества WSL2

✅ Нет бага с "nul" файлом
✅ Лучшая производительность для Node.js и npm
✅ Быстрее работает файловая система для node_modules
✅ Полная совместимость с Linux-инструментами
✅ Интеграция с VS Code / Kiro

## Шаг 1: Установка WSL2

### 1.1 Включить WSL2 (PowerShell от администратора)

```powershell
wsl --install
```

Эта команда:
- Включит необходимые компоненты Windows
- Установит Ubuntu по умолчанию
- Настроит WSL2

### 1.2 Перезагрузить компьютер

После установки перезагрузите Windows.

### 1.3 Настроить Ubuntu

После перезагрузки откроется Ubuntu и попросит создать пользователя:
- Введите имя пользователя (например: nikita)
- Введите пароль (запомните его!)

## Шаг 2: Обновление Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

## Шаг 3: Установка Node.js в WSL2

### 3.1 Установить NVM (Node Version Manager)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### 3.2 Перезагрузить терминал

```bash
source ~/.bashrc
```

### 3.3 Установить Node.js 20+

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### 3.4 Проверить установку

```bash
node --version  # должно быть v20.x.x
npm --version   # должно быть 10.x.x
```

## Шаг 4: Перенос проекта в WSL2

### Вариант А: Клонировать проект заново (рекомендуется)

Если проект в Git:

```bash
cd ~
mkdir projects
cd projects
git clone <ваш-репозиторий>
cd fashion-store
```

### Вариант Б: Скопировать существующий проект

Из Windows в WSL2:

```bash
# В WSL2 терминале
cd ~
mkdir projects
cd projects

# Скопировать из Windows (замените путь на ваш)
cp -r /mnt/c/Users/NIKITA/Desktop/1/fashion-store ./
cd fashion-store
```

**ВАЖНО:** Файлы должны находиться в файловой системе WSL2 (~/), а НЕ в /mnt/c/!
Это критично для производительности.

## Шаг 5: Установка зависимостей

```bash
cd ~/projects/fashion-store

# Удалить node_modules и lock файлы из Windows
rm -rf node_modules package-lock.json

# Установить зависимости заново
npm install
```

## Шаг 6: Настройка переменных окружения

```bash
# Скопировать .env файлы (если они не в Git)
# Или создать заново:
nano .env.local
```

Вставьте ваши переменные окружения и сохраните (Ctrl+X, Y, Enter).

## Шаг 7: Запуск проекта

```bash
npm run dev
```

Проект будет доступен по адресу: http://localhost:3000

## Шаг 8: Настройка VS Code / Kiro для WSL2

### 8.1 Установить расширение WSL

В VS Code / Kiro установите расширение: **WSL** (от Microsoft)

### 8.2 Открыть проект в WSL2

```bash
# В WSL2 терминале, в папке проекта:
code .
```

Или в VS Code:
1. Нажмите F1
2. Введите "WSL: Open Folder in WSL"
3. Выберите ~/projects/fashion-store

## Шаг 9: Проверка работы Tailwind CSS v4

После запуска `npm run dev` в WSL2:

1. Откройте http://localhost:3000
2. Проверьте, что стили загружаются
3. Проверьте консоль - не должно быть ошибок с "nul"
4. Попробуйте изменить CSS - hot reload должен работать

## Полезные команды WSL2

### Открыть проводник Windows в текущей папке WSL2
```bash
explorer.exe .
```

### Перейти в Windows диск из WSL2
```bash
cd /mnt/c/Users/NIKITA/Desktop
```

### Перейти в домашнюю папку WSL2
```bash
cd ~
```

### Узнать IP адрес WSL2
```bash
ip addr show eth0 | grep inet
```

### Остановить WSL2 (из PowerShell Windows)
```powershell
wsl --shutdown
```

### Список установленных дистрибутивов
```powershell
wsl --list --verbose
```

## Производительность

### ✅ ПРАВИЛЬНО (быстро):
```
~/projects/fashion-store  # Файлы в WSL2 файловой системе
```

### ❌ НЕПРАВИЛЬНО (медленно):
```
/mnt/c/Users/NIKITA/Desktop/1/fashion-store  # Файлы в Windows
```

**Всегда храните проект в файловой системе WSL2 для максимальной производительности!**

## Решение проблем

### Проблема: "Cannot connect to WSL"
```bash
# В PowerShell от администратора:
wsl --shutdown
wsl
```

### Проблема: Медленная работа npm
Убедитесь, что проект находится в ~/projects/, а не в /mnt/c/

### Проблема: Порт 3000 занят
```bash
# Найти процесс на порту 3000
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

### Проблема: Git credentials
```bash
# Настроить Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Использовать Windows credential manager
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

## Следующие шаги

После успешного запуска в WSL2:

1. ✅ Tailwind CSS v4 будет работать без ошибок
2. ✅ Next.js 16 с Turbopack будет работать стабильно
3. ✅ Производительность будет выше, чем в Windows
4. ✅ Все современные инструменты будут работать корректно

## Дополнительные оптимизации

### Увеличить память для WSL2

Создайте файл `.wslconfig` в `C:\Users\NIKITA\`:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

Перезапустите WSL2:
```powershell
wsl --shutdown
```

---

**Готово!** Теперь ваш проект будет работать в WSL2 с Tailwind CSS v4 и Next.js 16 без проблем.
