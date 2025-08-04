# SlotMachineBank Smart Contract

## Опис контракту

**SlotMachineBank** - це смарт-контракт для керування балансами гравців у слот-машині Cherry Charm на блокчейні IRYS. Контракт використовує нативні токени IRYS (подібно до ETH) для депозитів та виводів.

## Основні функції

### 🏦 Депозити та виводи (для гравців)

#### `deposit()` - Депозит коштів
```solidity
function deposit() external payable nonReentrant whenNotPaused
```
- **Призначення**: Гравці вносять нативні IRYS токени на свій ігровий баланс
- **Виклик**: Напряму з фронтенду
- **Мінімальна сума**: 0.01 IRYS (можна змінити адміном)
- **Події**: `Deposit(player, amount, newBalance)`

#### `withdraw(uint256 amount)` - Вивід коштів
```solidity
function withdraw(uint256 amount) external nonReentrant whenNotPaused
```
- **Призначення**: Гравці виводять кошти зі свого ігрового балансу
- **Параметри**: `amount` - сума у wei
- **Виклик**: Напряму з фронтенду
- **Події**: `Withdrawal(player, amount, newBalance)`

### 🎮 Керування балансами (для сервера)

#### `updateBalance()` - Оновлення балансу гравця
```solidity
function updateBalance(address player, int256 change, string calldata reason) external onlyServer
```
- **Призначення**: Сервер змінює баланс гравця після спіну
- **Параметри**: 
  - `player` - адреса гравця
  - `change` - зміна балансу (+ для виграшу, - для програшу)
  - `reason` - причина зміни ("win", "loss", "bet")
- **Доступ**: Тільки серверний гаманець
- **Події**: `BalanceUpdated(player, change, newBalance, reason)`

### 📊 Перегляд даних

#### `getBalance(address player)` - Баланс гравця
```solidity
function getBalance(address player) external view returns (uint256)
```
- **Повертає**: Поточний баланс гравця у wei

#### `hasSufficientBalance()` - Перевірка балансу
```solidity
function hasSufficientBalance(address player, uint256 betAmount) external view returns (bool)
```
- **Повертає**: `true` якщо у гравця достатньо коштів для ставки

#### `getContractBalance()` - Баланс контракту
```solidity
function getContractBalance() external view returns (uint256)
```
- **Повертає**: Загальний баланс контракту у wei

### 🔧 Адміністративні функції (тільки власник)

#### `updateServerWallet(address newServerWallet)` - Зміна серверного гаманця
#### `updateMinDeposit(uint256 newMinDeposit)` - Зміна мінімального депозиту
#### `pause()` / `unpause()` - Призупинення/відновлення роботи
#### `emergencyWithdraw(uint256 amount)` - Екстрений вивід коштів

## Безпека

### Модифікатори
- `onlyServer` - тільки серверний гаманець
- `validAddress` - перевірка валідності адреси
- `nonReentrant` - захист від реентрантності
- `whenNotPaused` - функція працює тільки коли контракт активний

### Захисні механізми
- **ReentrancyGuard** - захист від атак реентрантності
- **Pausable** - можливість призупинити контракт у разі проблем
- **Ownable** - контроль доступу до адміністративних функцій
- Перевірки балансів перед операціями
- Безпечні трансфери нативних токенів

## Події (Events)

```solidity
event Deposit(address indexed player, uint256 amount, uint256 newBalance);
event Withdrawal(address indexed player, uint256 amount, uint256 newBalance);
event BalanceUpdated(address indexed player, int256 change, uint256 newBalance, string reason);
event ServerWalletUpdated(address indexed oldServer, address indexed newServer);
event MinDepositUpdated(uint256 oldAmount, uint256 newAmount);
```

## Схема роботи

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │     BACKEND      │    │   BLOCKCHAIN    │
│   (React App)   │    │    (Server)      │    │     (IRYS)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. deposit()          │                       │
         ├──────────────────────────────────────────────►│
         │                       │                       │
         │ 2. spin game          │                       │
         ├──────────────────────►│                       │
         │                       │ 3. updateBalance()    │
         │                       ├──────────────────────►│
         │                       │                       │
         │ 4. withdraw()         │                       │
         ├──────────────────────────────────────────────►│
```

## Конфігурація мережі IRYS

```javascript
// Налаштування для IRYS Testnet
const IRYS_CONFIG = {
  network: "testnet",
  rpcUrl: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
  chainId: 1270,
  nativeCurrency: {
    name: "IRYS",
    symbol: "IRYS",
    decimals: 18
  }
};
```

## Приклад використання

### Депозит з фронтенду
```javascript
// Підключення до контракту
const contract = new ethers.Contract(contractAddress, abi, signer);

// Депозит 0.1 IRYS
const depositAmount = ethers.utils.parseEther("0.1");
const tx = await contract.deposit({ value: depositAmount });
await tx.wait();
```

### Оновлення балансу з сервера
```javascript
// Гравець програв 0.01 IRYS
const lossAmount = ethers.utils.parseEther("-0.01");
const tx = await contract.updateBalance(playerAddress, lossAmount, "loss");
await tx.wait();

// Гравець виграв 0.05 IRYS
const winAmount = ethers.utils.parseEther("0.05");
const tx = await contract.updateBalance(playerAddress, winAmount, "win");
await tx.wait();
```

### Вивід коштів
```javascript
// Вивід 0.05 IRYS
const withdrawAmount = ethers.utils.parseEther("0.05");
const tx = await contract.withdraw(withdrawAmount);
await tx.wait();
```

## Газові витрати (приблизно)

- `deposit()`: ~50,000 gas
- `withdraw()`: ~55,000 gas  
- `updateBalance()`: ~45,000 gas
- `getBalance()`: ~25,000 gas (view function)

## Тестування

Перед деплоєм рекомендується протестувати контракт на IRYS Testnet з наступними сценаріями:

1. ✅ Депозит мінімальної суми
2. ✅ Депозит суми менше мінімальної (має відхилитися)
3. ✅ Вивід коштів при достатньому балансі
4. ✅ Вивід коштів при недостатньому балансі (має відхилитися)
5. ✅ Оновлення балансу сервером (виграш/програш)
6. ✅ Спроба оновлення балансу не-сервером (має відхилитися)
7. ✅ Призупинення та відновлення контракту
8. ✅ Екстрений вивід коштів власником