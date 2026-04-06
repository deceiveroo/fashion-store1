# Быстрый старт WSL2

## 1. Установка WSL2 (PowerShell от администратора)

```powershell
wsl --install
```

Перезагрузите компьютер.

## 2. Установка Node.js в WSL2

```bash
# Установить NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Установить Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

## 3. Перенос проекта

```bash
# Создать папку для проектов
cd ~
mkdir projects
cd projects

# Скопировать проект из Windows
cp -r /mnt/c/Users/NIKITA/Desktop/1/fashion-store ./
cd fashion-store

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install
```

## 4. Скопировать .env файлы

```bash
# Если .env файлы не скопировались, создайте их вручную
nano .env.local
# Вставьте содержимое и сохраните (Ctrl+X, Y, Enter)

nano .env
# Вставьте содержимое и сохраните
```

## 5. Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

## 6. Открыть в VS Code / Kiro

```bash
code .
```

---

**Готово!** Tailwind CSS v4 + Next.js 16 теперь работают без ошибок.
