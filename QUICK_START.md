# 🚀 Швидкий старт блокчейн інтеграції

## 📋 Крок 1: Встановлення залежностей

```bash
npm install
```

## ⚙️ Крок 2: Налаштування .env

Відкрийте `.env` файл та заповніть:

```env
# Ваш приватний ключ (починається з 0x)
PRIVATE_KEY=0x1234567890abcdef...

# Адреса серверного гаманця
SERVER_WALLET_ADDRESS=0xabcdef...
```

## 🔧 Крок 3: Деплой контракту

```bash
# Компіляція та деплой одразу
npm run blockchain:deploy
```

Або покроково:

```bash
# 1. Компіляція
npm run blockchain:compile

# 2. Деплой
npm run blockchain:deploy

# 3. Верифікація
npm run blockchain:verify
```

## ✅ Готово!

Після успішного деплою:
- Адреса контракту буде автоматично додана в `.env`
- Артефакти збережені в папці `artifacts/`
- Інформація про деплой в папці `deployments/`

## 🔍 Перевірка

```bash
npm run blockchain:verify
```

## 🌐 Мережа IRYS Testnet

- **RPC**: https://testnet-rpc.irys.xyz/v1/execution-rpc
- **Chain ID**: 1270
- **Faucet**: [Отримати тестові IRYS токени]

## 🆘 Проблеми?

1. **"Insufficient funds"** - поповніть гаманець IRYS токенами
2. **"Invalid private key"** - переконайтеся, що ключ починається з "0x"
3. **"Network error"** - перевірте інтернет з'єднання

## 📞 Підтримка

Якщо виникли проблеми, перевірте:
- Баланс гаманця
- Правильність приватного ключа
- Доступність RPC URL