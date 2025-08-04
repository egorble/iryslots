# 🎰 Cherry Charm - Web3 Slot Machine

Повноцінна 3D слот-машина з блокчейн інтеграцією на мережі IRYS.

## ⚡ Швидкий старт

### 1. Встановлення
```bash
# Клонування та встановлення всіх залежностей
git clone <your-repo>
cd cherry-charm
npm run setup
```

### 2. Конфігурація
```bash
# Скопіюйте та налаштуйте .env файл
cp .env.example .env
# Відредагуйте .env з вашими ключами
```

### 3. Запуск
```bash
# Запуск всієї системи одразу
npm run start:all
```

Відкрийте http://localhost:5173 та насолоджуйтесь грою! 🎮

## 🎯 Особливості

### 🎮 Два режими гри
- **Demo режим**: Безкоштовна гра з віртуальними монетами
- **Blockchain режим**: Гра з реальними IRYS токенами

### 🔗 Web3 інтеграція
- MetaMask підключення
- Депозити та виводи IRYS токенів
- Прозорі смарт-контракт транзакції
- Серверна валідація результатів

### 🎰 Ігрові механіки
- 3 барабани з 4 фруктами (🍒🍎🍌🍋)
- RTP (Return to Player): ~85%
- Різні виплати за комбінації
- Анімовані 3D графіка

## 🏗️ Архітектура

```
Frontend (React + Three.js)
    ↓ API calls
Backend (Express + Node.js)
    ↓ Blockchain calls
Smart Contract (Solidity + IRYS)
```

### Компоненти системи:
- **Frontend**: React додаток з 3D графікою
- **Backend**: Express API сервер
- **Smart Contract**: Solidity контракт на IRYS
- **Database**: Логи та статистика (файли)

## 📊 Виплати

| Комбінація | Виплата |
|------------|---------|
| 🍒🍒🍒     | 21 монет |
| 🍒🍒       | 16 монет |
| 🍎🍎🍎     | 8 монет  |
| 🍎🍎       | 4 монети |
| 🍌🍌🍌     | 6 монет  |
| 🍌🍌       | 2 монети |
| 🍋🍋🍋     | 3 монети |

**Конвертація**: 1 IRYS = 100 ігрових монет

## 🔧 Розробка

### Структура проекту
```
cherry-charm/
├── src/                    # Frontend код
│   ├── components/         # React компоненти
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Утиліти та API
│   └── stores/            # Zustand store
├── server/                # Backend код
│   ├── server.js          # Express сервер
│   ├── test-server.js     # API тести
│   └── logs/              # Логи сервера
├── contracts/             # Smart contracts
├── artifacts/             # Скомпільовані контракти
└── deployments/           # Інформація про деплой
```

### Доступні команди
```bash
# Розробка
npm run dev                # Тільки frontend
npm run start:all          # Frontend + Backend

# Блокчейн
npm run compile            # Компіляція контракту
npm run deploy             # Деплой контракту
npm run verify             # Верифікація контракту

# Тестування
npm run test:contract      # Тести контракту
npm run test:full          # Повне тестування

# Утиліти
npm run fund               # Поповнення контракту
npm run check              # Перевірка системи
```

## 🌐 API Endpoints

### Server API (http://localhost:3001)
- `GET /health` - Стан сервера
- `GET /api/balance/:address` - Баланс гравця
- `POST /api/game-result` - Результат гри
- `GET /api/stats` - Статистика контракту

### Приклад API запиту
```javascript
// Відправка результату гри
const response = await fetch('http://localhost:3001/api/game-result', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerAddress: '0x...',
    betAmount: 5,
    winAmount: 21,
    gameData: {
      fruit0: 'CHERRY',
      fruit1: 'CHERRY',
      fruit2: 'CHERRY',
      timestamp: Date.now()
    }
  })
});
```

## 🔒 Безпека

### Smart Contract
- Верифікований код на IRYS Testnet
- Захист від реентрантності
- Контроль доступу (тільки сервер може оновлювати баланси)
- Можливість паузи в екстрених ситуаціях

### Backend
- Rate limiting (100 req/15min, 30 game req/min)
- Валідація всіх вхідних даних
- Серверна перевірка розрахунків виграшів
- CORS налаштування
- Детальне логування

### Frontend
- Валідація MetaMask підключення
- Перевірка мережі IRYS
- Обробка помилок транзакцій
- Захист від некоректних вводів

## 🧪 Тестування

### Автоматичні тести
```bash
# Тестування смарт-контракту
npm run test:contract

# Тестування API сервера
cd server && npm test

# Повне тестування системи
npm run test:full
```

### Ручне тестування
1. Запустіть систему: `npm run start:all`
2. Відкрийте http://localhost:5173
3. Спробуйте demo режим
4. Підключіть MetaMask
5. Переключіться на blockchain режим
6. Зробіть депозит та грайте

## 📈 Моніторинг

### Логи
```bash
# Перегляд логів сервера
tail -f server/logs/combined.log

# Тільки помилки
tail -f server/logs/error.log
```

### Метрики
- Кількість ігор на хвилину
- Успішність транзакцій
- Середній час відповіді API
- Баланс контракту

## 🚀 Деплой

### Testnet (поточний)
- Мережа: IRYS Testnet
- Chain ID: 1270
- Контракт: 0xA88ce26B2895a27b26ab92d5F179d99Ac4D75CC1

### Mainnet (майбутнє)
1. Змініть мережу в .env на mainnet
2. Оновіть RPC URL
3. Деплойте новий контракт
4. Оновіть frontend конфігурацію

## 🤝 Внесок у проект

1. Fork репозиторій
2. Створіть feature branch
3. Зробіть зміни
4. Додайте тести
5. Створіть Pull Request

## 📄 Ліцензія

GNU Affero General Public License v3.0

**УВАГА! ВІЛЬНЕ ПРОГРАМНЕ ЗАБЕЗПЕЧЕННЯ**
Якщо ви використовуєте будь-яку частину цього коду, ви повинні зробити вихідний код всього вашого проекту публічно доступним під тією ж ліцензією.

## 🆘 Підтримка

### Часті проблеми
- **MetaMask не підключається**: Додайте мережу IRYS вручну
- **Транзакції не проходять**: Перевірте баланс IRYS токенів
- **Сервер не запускається**: Перевірте порт 3001 та .env файл

### Контакти
- GitHub Issues: [Створити issue](https://github.com/your-repo/issues)
- Документація: Див. файли README в папках проекту

## 🎉 Готово!

Тепер у вас є повноцінна Web3 слот-машина з:
- ✅ 3D графіка та анімації
- ✅ Блокчейн інтеграція
- ✅ Два режими гри
- ✅ Безпечна серверна обробка
- ✅ Повне тестування

Насолоджуйтесь грою та розробкою! 🎰🔗