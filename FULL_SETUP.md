# 🚀 Повне налаштування Cherry Charm з блокчейн інтеграцією

## 📋 Передумови

1. **Node.js** версії 18+
2. **npm** або **yarn**
3. **MetaMask** встановлений в браузері
4. **IRYS токени** на testnet для тестування

## 🔧 Крок 1: Клонування та встановлення

```bash
# Клонуйте репозиторій (якщо потрібно)
git clone <your-repo-url>
cd cherry-charm

# Встановіть залежності для фронтенду
npm install

# Встановіть залежності для сервера
cd server
npm install
cd ..
```

## ⚙️ Крок 2: Налаштування середовища

### Основний .env файл (корінь проекту)
```env
# IRYS Network Configuration
IRYS_NETWORK=testnet
IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
IRYS_CHAIN_ID=1270

# Wallet Configuration
PRIVATE_KEY=0x...  # Ваш приватний ключ для деплою
SERVER_WALLET_ADDRESS=0x...  # Адреса серверного гаманця
SERVER_WALLET_KEY=...  # Приватний ключ серверного гаманця (без 0x)

# Contract Configuration
CONTRACT_ADDRESS=0xA88ce26B2895a27b26ab92d5F179d99Ac4D75CC1
MIN_DEPOSIT=0.01

# Frontend Configuration
VITE_IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
VITE_IRYS_CHAIN_ID=1270
VITE_CONTRACT_ADDRESS=0xA88ce26B2895a27b26ab92d5F179d99Ac4D75CC1
VITE_SERVER_ENDPOINT=http://localhost:3001

# Development
NODE_ENV=development
DEBUG=true
```

## 🏗️ Крок 3: Деплой смарт-контракту (якщо потрібно)

```bash
# Компіляція контракту
npm run compile

# Деплой на IRYS testnet
npm run deploy

# Верифікація деплою
npm run verify

# Тестування контракту
npm run test:contract
```

## 🖥️ Крок 4: Запуск сервера

```bash
# В одному терміналі
cd server
npm run dev
```

Сервер запуститься на `http://localhost:3001`

### Тестування сервера
```bash
# В іншому терміналі
cd server
npm test
```

## 🎮 Крок 5: Запуск фронтенду

```bash
# В новому терміналі (корінь проекту)
npm run dev
```

Фронтенд запуститься на `http://localhost:5173`

## 🔍 Крок 6: Перевірка роботи

### 1. Відкрийте браузер
Перейдіть на `http://localhost:5173`

### 2. Перевірте demo режим
- Переконайтеся, що вибрано "🎮 Demo" режим
- Спробуйте зіграти кілька разів
- Перевірте, що баланс оновлюється

### 3. Перевірте blockchain режим
- Переключіться на "🔗 Blockchain" режим
- Підключіть MetaMask
- Зробіть депозит (мінімум 0.005 IRYS)
- Спробуйте зіграти
- Перевірте, що транзакції проходять через сервер

## 🧪 Повне тестування системи

### Автоматичні тести
```bash
# Тестування контракту
npm run test:contract

# Тестування сервера
cd server && npm test

# Повне тестування
npm run test:full
```

### Ручне тестування
1. **Demo режим**: Гра без блокчейну
2. **Підключення гаманця**: MetaMask інтеграція
3. **Депозити**: Поповнення ігрового балансу
4. **Ігровий процес**: Ставки та виграші
5. **Виводи**: Повернення коштів в гаманець
6. **Серверна обробка**: Перевірка логів сервера

## 📊 Моніторинг

### Логи сервера
```bash
# Перегляд логів в реальному часі
tail -f server/logs/combined.log

# Тільки помилки
tail -f server/logs/error.log
```

### Перевірка стану
- **Сервер**: `http://localhost:3001/health`
- **Статистика контракту**: `http://localhost:3001/api/stats`
- **Баланс гравця**: `http://localhost:3001/api/balance/0x...`

## 🚨 Troubleshooting

### Проблема: Сервер не запускається
```bash
# Перевірте порт
lsof -i :3001

# Перевірте змінні середовища
cd server && node -e "console.log(process.env.CONTRACT_ADDRESS)"
```

### Проблема: MetaMask не підключається
1. Перевірте, що MetaMask встановлено
2. Додайте мережу IRYS Testnet вручну
3. Перевірте Chain ID (1270)

### Проблема: Транзакції не проходять
1. Перевірте баланс IRYS токенів
2. Перевірте логи сервера
3. Перевірте, що серверний гаманець має права на контракт

### Проблема: Фронтенд не підключається до сервера
1. Перевірте, що сервер запущений на порту 3001
2. Перевірте CORS налаштування
3. Перевірте `VITE_SERVER_ENDPOINT` в .env

## 🔧 Налаштування для продакшну

### 1. Змінні середовища
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### 2. HTTPS
Налаштуйте SSL сертифікати для продакшн сервера

### 3. База даних
Додайте базу даних для зберігання історії ігор

### 4. Моніторинг
Налаштуйте PM2 або Docker для управління процесами

## 📈 Масштабування

### Горизонтальне масштабування
- Використовуйте load balancer
- Додайте Redis для сесій
- Розділіть сервер на мікросервіси

### Вертикальне масштабування
- Збільште ресурси сервера
- Оптимізуйте запити до блокчейну
- Додайте кешування

## 🎯 Готово!

Тепер у вас повністю налаштована система Cherry Charm з:
- ✅ Фронтенд (React + Three.js)
- ✅ Бекенд (Express + API)
- ✅ Блокчейн (IRYS + Smart Contract)
- ✅ Два режими гри (Demo + Blockchain)
- ✅ Повна інтеграція та тестування

Насолоджуйтесь грою! 🎰🔗