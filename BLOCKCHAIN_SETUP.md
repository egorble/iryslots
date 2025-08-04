# 🚀 Налаштування блокчейн інтеграції Cherry Charm

## 📋 Передумови

1. **Node.js** версії 18+ 
2. **npm** або **yarn**
3. **Гаманець з IRYS токенами** для деплою
4. **Приватний ключ** гаманця

## 🔧 Крок 1: Встановлення залежностей

```bash
# Встановлюємо залежності для блокчейну
npm install ethers@^6.8.0 dotenv@^16.3.1 solc@^0.8.30
```

## ⚙️ Крок 2: Налаштування .env файлу

Відкрийте `.env` файл та заповніть наступні поля:

```env
# IRYS Network Configuration
IRYS_NETWORK=testnet
IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
IRYS_CHAIN_ID=1270

# Wallet Configuration
PRIVATE_KEY=0x1234567890abcdef...  # ВАШ ПРИВАТНИЙ КЛЮЧ
SERVER_WALLET_ADDRESS=0xabcdef...  # АДРЕСА СЕРВЕРНОГО ГАМАНЦЯ

# Contract Configuration
CONTRACT_ADDRESS=                   # Буде заповнено автоматично після деплою
MIN_DEPOSIT=0.01

# Frontend Configuration
VITE_IRYS_RPC_URL=https://testnet-rpc.irys.xyz/v1/execution-rpc
VITE_IRYS_CHAIN_ID=1270
VITE_CONTRACT_ADDRESS=             # Буде заповнено автоматично після деплою
VITE_SERVER_ENDPOINT=http://localhost:3001
```

### 🔑 Як отримати приватний ключ:

1. **MetaMask**: Settings → Security & Privacy → Reveal Private Key
2. **Інші гаманці**: Зазвичай в налаштуваннях безпеки

⚠️ **УВАГА**: Ніколи не діліться приватним ключем і не коммітьте його в git!

## 🏗️ Крок 3: Компіляція та деплой

### Компіляція контракту
```bash
node scripts/compile.js
```

### Деплой на тестнет
```bash
node scripts/deploy.js
```

### Верифікація деплою
```bash
node scripts/verify.js
```

## 📊 Що відбувається під час деплою:

1. **Компіляція**: Solidity код → Bytecode + ABI
2. **Підключення**: До IRYS testnet
3. **Перевірка балансу**: Чи достатньо IRYS для деплою
4. **Деплой**: Відправка транзакції з контрактом
5. **Підтвердження**: Очікування включення в блок
6. **Тестування**: Перевірка основних функцій
7. **Збереження**: Оновлення .env та збереження артефактів

## 🔍 Структура файлів після деплою:

```
├── contracts/
│   ├── SlotMachineBank.sol     # Смарт-контракт
│   └── README.md               # Документація контракту
├── scripts/
│   ├── compile.js              # Компіляція
│   ├── deploy.js               # Деплой
│   └── verify.js               # Верифікація
├── artifacts/
│   └── SlotMachineBank.json    # ABI + Bytecode
├── deployments/
│   └── testnet-deployment.json # Інформація про деплой
└── .env                        # Конфігурація
```

## 🧪 Тестування контракту

Після деплою ви можете протестувати контракт:

```javascript
// Приклад взаємодії з контрактом
const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Завантажуємо ABI
const artifact = require('./artifacts/SlotMachineBank.json');
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  artifact.abi,
  wallet
);

// Тестовий депозит
async function testDeposit() {
  const tx = await contract.deposit({ 
    value: ethers.parseEther('0.1') 
  });
  await tx.wait();
  console.log('Депозит успішний!');
}
```

## 🚨 Можливі помилки та рішення:

### ❌ "Insufficient funds"
- **Проблема**: Недостатньо IRYS на гаманці
- **Рішення**: Поповніть гаманець IRYS токенами

### ❌ "Invalid private key"
- **Проблема**: Неправильний формат приватного ключа
- **Рішення**: Переконайтеся, що ключ починається з "0x"

### ❌ "Network error"
- **Проблема**: Проблеми з підключенням до RPC
- **Рішення**: Перевірте IRYS_RPC_URL

### ❌ "Contract not found"
- **Проблема**: Контракт не деплойнуто або неправильна адреса
- **Рішення**: Перезапустіть деплой або перевірте CONTRACT_ADDRESS

## 🔄 Оновлення контракту

Якщо потрібно оновити контракт:

1. Внесіть зміни в `contracts/SlotMachineBank.sol`
2. Запустіть `node scripts/compile.js`
3. Запустіть `node scripts/deploy.js` (деплой нового контракту)
4. Оновіть фронтенд з новою адресою контракту

## 🌐 Перехід на mainnet

Для деплою на mainnet:

1. Змініть в `.env`:
   ```env
   IRYS_NETWORK=mainnet
   IRYS_RPC_URL=https://rpc.irys.xyz/v1/execution-rpc
   ```

2. Переконайтеся, що у вас достатньо IRYS на mainnet

3. Запустіть деплой:
   ```bash
   node scripts/deploy.js
   ```

## 📞 Підтримка

Якщо виникли проблеми:
1. Перевірте логи в консолі
2. Переконайтеся, що всі змінні в `.env` заповнені
3. Перевірте баланс гаманця
4. Переконайтеся, що RPC URL доступний

## 🎯 Наступні кроки

Після успішного деплою:
1. ✅ Інтегруйте контракт у фронтенд
2. ✅ Налаштуйте серверну частину
3. ✅ Протестуйте повний флоу гри
4. ✅ Деплойте на mainnet