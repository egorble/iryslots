# 🖥️ Cherry Charm Server

Backend сервер для обробки блокчейн транзакцій Cherry Charm слот-машини.

## 🚀 Швидкий старт

### 1. Встановлення залежностей
```bash
cd server
npm install
```

### 2. Налаштування середовища
```bash
# Скопіюйте .env файл з кореневої папки або створіть новий
cp ../.env .env

# Або скопіюйте приклад та заповніть
cp .env.example .env
```

### 3. Запуск сервера
```bash
# Розробка (з автоперезавантаженням)
npm run dev

# Продакшн
npm start
```

### 4. Тестування
```bash
npm test
```

## 📋 API Endpoints

### Health Check
```
GET /health
```
Перевіряє стан сервера та підключення до блокчейну.

### Баланс гравця
```
GET /api/balance/:address
```
Отримує поточний ігровий баланс гравця.

**Параметри:**
- `address` - Ethereum адреса гравця

**Відповідь:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "balance": 150,
    "balanceWei": "1500000000000000000",
    "balanceIRYS": "1.5"
  }
}
```

### Результат гри
```
POST /api/game-result
```
Обробляє результат гри та оновлює баланс гравця в блокчейні.

**Тіло запиту:**
```json
{
  "playerAddress": "0x...",
  "betAmount": 5,
  "winAmount": 21,
  "gameData": {
    "fruit0": "CHERRY",
    "fruit1": "CHERRY", 
    "fruit2": "CHERRY",
    "timestamp": 1704067200000
  }
}
```

**Відповідь:**
```json
{
  "success": true,
  "data": {
    "playerAddress": "0x...",
    "netChange": 16,
    "newBalance": 166,
    "newBalanceIRYS": "1.66",
    "txHash": "0x...",
    "reason": "win-CHERRY-CHERRY-CHERRY",
    "gameData": {
      "fruits": ["CHERRY", "CHERRY", "CHERRY"],
      "bet": 5,
      "win": 21,
      "timestamp": 1704067200000
    }
  }
}
```

### Статистика контракту
```
GET /api/stats
```
Отримує загальну статистику смарт-контракту.

**Відповідь:**
```json
{
  "success": true,
  "data": {
    "totalDeposited": "10.5",
    "contractBalance": "8.3",
    "minDeposit": "0.005",
    "isPaused": false,
    "network": "testnet",
    "contractAddress": "0x..."
  }
}
```

## 🔒 Безпека

### Rate Limiting
- **Загальний**: 100 запитів на 15 хвилин на IP
- **Ігрові результати**: 30 запитів на хвилину на IP

### Валідація
- Всі вхідні дані валідуються за допомогою Joi
- Перевірка формату Ethereum адрес
- Валідація часових міток (толерантність 1 хвилина)
- Серверна перевірка розрахунків виграшів

### Захист
- Helmet.js для HTTP заголовків безпеки
- CORS налаштований для фронтенду
- Логування всіх запитів та помилок

## 🎮 Логіка гри

### Розрахунок виграшів
Сервер перевіряє розрахунки виграшів клієнта:

```javascript
const calculateWin = (fruit0, fruit1, fruit2) => {
  if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY' && fruit2 === 'CHERRY') return 21;
  if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY') return 16;
  if (fruit0 === 'APPLE' && fruit1 === 'APPLE' && fruit2 === 'APPLE') return 8;
  if (fruit0 === 'APPLE' && fruit1 === 'APPLE') return 4;
  if (fruit0 === 'BANANA' && fruit1 === 'BANANA' && fruit2 === 'BANANA') return 6;
  if (fruit0 === 'BANANA' && fruit1 === 'BANANA') return 2;
  if (fruit0 === 'LEMON' && fruit1 === 'LEMON' && fruit2 === 'LEMON') return 3;
  return 0;
};
```

### Конвертація валют
- **1 IRYS = 100 ігрових монет**
- Всі розрахунки на сервері в монетах
- Конвертація в wei для блокчейн транзакцій

## 📊 Логування

Сервер логує всі важливі події:
- Запити та відповіді API
- Блокчейн транзакції
- Помилки та попередження
- Результати ігор

Логи зберігаються в папці `logs/`:
- `combined.log` - всі логи
- `error.log` - тільки помилки

## 🔧 Налаштування

### Змінні середовища
```env
# Сервер
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Блокчейн
IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
CONTRACT_ADDRESS=0x...
SERVER_WALLET_KEY=0x...

# Безпека
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Продакшн налаштування
- Встановіть `NODE_ENV=production`
- Використовуйте HTTPS
- Налаштуйте зворотний проксі (nginx)
- Встановіть моніторинг (PM2)

## 🧪 Тестування

### Автоматичні тести
```bash
npm test
```

### Ручне тестування
```bash
# Запустіть сервер
npm run dev

# В іншому терміналі
curl http://localhost:3001/health
```

## 🚨 Обробка помилок

### Типи помилок
- **400 Bad Request**: Некоректні дані
- **429 Too Many Requests**: Перевищено ліміт запитів
- **500 Internal Server Error**: Помилка сервера/блокчейну
- **503 Service Unavailable**: Контракт призупинено

### Приклади помилок
```json
{
  "success": false,
  "error": "Insufficient balance for bet"
}
```

## 🔄 Інтеграція з фронтендом

Фронтенд використовує API клієнт (`src/utils/api.ts`) для взаємодії з сервером:

```typescript
import { apiClient } from '../utils/api';

// Відправка результату гри
const response = await apiClient.submitGameResult({
  playerAddress: '0x...',
  betAmount: 5,
  winAmount: 21,
  gameData: {
    fruit0: 'CHERRY',
    fruit1: 'CHERRY',
    fruit2: 'CHERRY',
    timestamp: Date.now()
  }
});
```

## 📈 Моніторинг

### Метрики для відстеження
- Кількість запитів на хвилину
- Час відповіді API
- Успішність блокчейн транзакцій
- Помилки та їх частота

### Рекомендовані інструменти
- **PM2** для управління процесами
- **Winston** для логування (вже інтегровано)
- **Prometheus** для метрик
- **Grafana** для візуалізації

## 🛠️ Розробка

### Додавання нових endpoints
1. Додайте маршрут в `server.js`
2. Створіть схему валідації Joi
3. Додайте обробку помилок
4. Оновіть API клієнт
5. Додайте тести

### Структура проекту
```
server/
├── server.js          # Основний серверний файл
├── test-server.js      # Тести API
├── package.json        # Залежності
├── .env.example        # Приклад конфігурації
├── logs/              # Логи сервера
└── README.md          # Ця документація
```

## 🎯 Готово!

Сервер готовий для обробки блокчейн транзакцій Cherry Charm! 🎰