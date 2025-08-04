const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Завантажуємо ABI контракту
const contractArtifact = JSON.parse(fs.readFileSync('./artifacts/SlotMachineBank.json', 'utf8'));

// Налаштування мережі
const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);

// Гаманці
const playerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const serverWallet = new ethers.Wallet(process.env.SERVER_WALLET_KEY, provider);

// Контракт
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractArtifact.abi,
  provider
);

// Контракт з підключенням гравця
const playerContract = contract.connect(playerWallet);
// Контракт з підключенням сервера
const serverContract = contract.connect(serverWallet);

// Утиліти
function formatIRYS(wei) {
  return ethers.formatEther(wei);
}

function parseIRYS(amount) {
  return ethers.parseEther(amount.toString());
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Функція для логування з часом
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Тест 1: Перевірка початкового стану
async function testInitialState() {
  log('🔍 Тест 1: Перевірка початкового стану контракту');
  
  try {
    const owner = await contract.owner();
    const serverWalletAddr = await contract.serverWallet();
    const minDeposit = await contract.minDeposit();
    const contractBalance = await contract.getContractBalance();
    const totalDeposited = await contract.totalDeposited();
    const isPaused = await contract.paused();
    
    log(`   👑 Власник: ${owner}`);
    log(`   🖥️  Серверний гаманець: ${serverWalletAddr}`);
    log(`   💰 Мінімальний депозит: ${formatIRYS(minDeposit)} IRYS`);
    log(`   🏦 Баланс контракту: ${formatIRYS(contractBalance)} IRYS`);
    log(`   📊 Загальна сума депозитів: ${formatIRYS(totalDeposited)} IRYS`);
    log(`   ⏸️  Призупинено: ${isPaused}`);
    
    // Перевіряємо баланси гаманців
    const playerBalance = await provider.getBalance(playerWallet.address);
    const serverBalance = await provider.getBalance(serverWallet.address);
    
    log(`   👤 Баланс гравця: ${formatIRYS(playerBalance)} IRYS`);
    log(`   🖥️  Баланс сервера: ${formatIRYS(serverBalance)} IRYS`);
    
    log('✅ Тест 1 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 1 провалено: ${error.message}\\n`);
    return false;
  }
}

// Тест 2: Депозит гравця
async function testPlayerDeposit() {
  log('💰 Тест 2: Депозит гравця');
  
  try {
    const depositAmount = parseIRYS('0.1'); // 0.1 IRYS
    
    log(`   📤 Депозит ${formatIRYS(depositAmount)} IRYS...`);
    
    // Перевіряємо баланс до депозиту
    const balanceBefore = await contract.getBalance(playerWallet.address);
    log(`   📊 Баланс гравця до депозиту: ${formatIRYS(balanceBefore)} IRYS`);
    
    // Робимо депозит
    const tx = await playerContract.deposit({ value: depositAmount });
    log(`   ⏳ Транзакція депозиту: ${tx.hash}`);
    
    const receipt = await tx.wait();
    log(`   ✅ Депозит підтверджено в блоці: ${receipt.blockNumber}`);
    
    // Перевіряємо баланс після депозиту
    const balanceAfter = await contract.getBalance(playerWallet.address);
    log(`   📊 Баланс гравця після депозиту: ${formatIRYS(balanceAfter)} IRYS`);
    
    // Перевіряємо події
    const depositEvent = receipt.logs.find(log => 
      log.topics[0] === ethers.id('Deposit(address,uint256,uint256)')
    );
    
    if (depositEvent) {
      log(`   🎉 Подія Deposit зафіксована`);
    }
    
    log('✅ Тест 2 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 2 провалено: ${error.message}\\n`);
    return false;
  }
}

// Тест 3: Імітація гри (ставка та виграш/програш)
async function testGameSimulation() {
  log('🎰 Тест 3: Імітація гри');
  
  try {
    const betAmount = parseIRYS('0.01'); // Ставка 0.01 IRYS
    
    // Перевіряємо баланс до ставки
    const balanceBefore = await contract.getBalance(playerWallet.address);
    log(`   📊 Баланс гравця до ставки: ${formatIRYS(balanceBefore)} IRYS`);
    
    // Перевіряємо, чи достатньо коштів для ставки
    const hasSufficient = await contract.hasSufficientBalance(playerWallet.address, betAmount);
    log(`   💳 Достатньо коштів для ставки: ${hasSufficient}`);
    
    if (!hasSufficient) {
      throw new Error('Недостатньо коштів для ставки');
    }
    
    // Сценарій 1: Програш (віднімаємо ставку)
    log(`   🎲 Сценарій 1: Програш - віднімаємо ставку ${formatIRYS(betAmount)} IRYS`);
    
    const lossTx = await serverContract.updateBalance(
      playerWallet.address,
      -betAmount, // Від'ємне значення для програшу
      'loss'
    );
    
    await lossTx.wait();
    log(`   ✅ Програш оброблено: ${lossTx.hash}`);
    
    const balanceAfterLoss = await contract.getBalance(playerWallet.address);
    log(`   📊 Баланс після програшу: ${formatIRYS(balanceAfterLoss)} IRYS`);
    
    await delay(2000);
    
    // Сценарій 2: Виграш (додаємо виграш)
    const winAmount = parseIRYS('0.05'); // Виграш 0.05 IRYS
    log(`   🎉 Сценарій 2: Виграш - додаємо ${formatIRYS(winAmount)} IRYS`);
    
    const winTx = await serverContract.updateBalance(
      playerWallet.address,
      winAmount, // Позитивне значення для виграшу
      'win'
    );
    
    await winTx.wait();
    log(`   ✅ Виграш оброблено: ${winTx.hash}`);
    
    const balanceAfterWin = await contract.getBalance(playerWallet.address);
    log(`   📊 Баланс після виграшу: ${formatIRYS(balanceAfterWin)} IRYS`);
    
    log('✅ Тест 3 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 3 провалено: ${error.message}\\n`);
    return false;
  }
}

// Тест 4: Вивід коштів
async function testPlayerWithdraw() {
  log('💸 Тест 4: Вивід коштів гравцем');
  
  try {
    // Перевіряємо поточний баланс
    const currentBalance = await contract.getBalance(playerWallet.address);
    log(`   📊 Поточний баланс гравця: ${formatIRYS(currentBalance)} IRYS`);
    
    if (currentBalance === 0n) {
      log(`   ⚠️  Баланс гравця нульовий, пропускаємо тест виводу`);
      return true;
    }
    
    // Виводимо половину балансу
    const withdrawAmount = currentBalance / 2n;
    log(`   📤 Вивід ${formatIRYS(withdrawAmount)} IRYS...`);
    
    // Перевіряємо баланс нативних токенів до виводу
    const nativeBalanceBefore = await provider.getBalance(playerWallet.address);
    
    const tx = await playerContract.withdraw(withdrawAmount);
    log(`   ⏳ Транзакція виводу: ${tx.hash}`);
    
    const receipt = await tx.wait();
    log(`   ✅ Вивід підтверджено в блоці: ${receipt.blockNumber}`);
    
    // Перевіряємо баланси після виводу
    const gameBalanceAfter = await contract.getBalance(playerWallet.address);
    const nativeBalanceAfter = await provider.getBalance(playerWallet.address);
    
    log(`   📊 Ігровий баланс після виводу: ${formatIRYS(gameBalanceAfter)} IRYS`);
    log(`   💰 Нативний баланс збільшився на: ${formatIRYS(nativeBalanceAfter - nativeBalanceBefore)} IRYS`);
    
    log('✅ Тест 4 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 4 провалено: ${error.message}\\n`);
    return false;
  }
}

// Тест 5: Множинні гравці
async function testMultiplePlayers() {
  log('👥 Тест 5: Множинні гравці');
  
  try {
    // Створюємо додаткових гравців
    const player2 = ethers.Wallet.createRandom().connect(provider);
    const player3 = ethers.Wallet.createRandom().connect(provider);
    
    log(`   👤 Гравець 2: ${player2.address}`);
    log(`   👤 Гравець 3: ${player3.address}`);
    
    // Переводимо їм трохи IRYS для тестування (з основного гаманця)
    const fundAmount = parseIRYS('0.05');
    
    log(`   💸 Фінансування гравців...`);
    
    const fundTx2 = await playerWallet.sendTransaction({
      to: player2.address,
      value: fundAmount
    });
    await fundTx2.wait();
    
    const fundTx3 = await playerWallet.sendTransaction({
      to: player3.address,
      value: fundAmount
    });
    await fundTx3.wait();
    
    log(`   ✅ Гравці профінансовані`);
    
    // Гравці роблять депозити
    const player2Contract = contract.connect(player2);
    const player3Contract = contract.connect(player3);
    
    const depositAmount = parseIRYS('0.02');
    
    log(`   💰 Депозити гравців...`);
    
    const deposit2 = await player2Contract.deposit({ value: depositAmount });
    await deposit2.wait();
    
    const deposit3 = await player3Contract.deposit({ value: depositAmount });
    await deposit3.wait();
    
    // Перевіряємо баланси
    const balance2 = await contract.getBalance(player2.address);
    const balance3 = await contract.getBalance(player3.address);
    
    log(`   📊 Баланс гравця 2: ${formatIRYS(balance2)} IRYS`);
    log(`   📊 Баланс гравця 3: ${formatIRYS(balance3)} IRYS`);
    
    // Імітуємо гру для обох гравців
    log(`   🎰 Імітація гри для гравця 2 (програш)...`);
    await serverContract.updateBalance(player2.address, -parseIRYS('0.01'), 'loss');
    
    log(`   🎰 Імітація гри для гравця 3 (виграш)...`);
    await serverContract.updateBalance(player3.address, parseIRYS('0.03'), 'win');
    
    // Фінальні баланси
    const finalBalance2 = await contract.getBalance(player2.address);
    const finalBalance3 = await contract.getBalance(player3.address);
    
    log(`   📊 Фінальний баланс гравця 2: ${formatIRYS(finalBalance2)} IRYS`);
    log(`   📊 Фінальний баланс гравця 3: ${formatIRYS(finalBalance3)} IRYS`);
    
    log('✅ Тест 5 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 5 провалено: ${error.message}\\n`);
    return false;
  }
}

// Тест 6: Адміністративні функції
async function testAdminFunctions() {
  log('⚙️ Тест 6: Адміністративні функції');
  
  try {
    // Тестуємо зміну мінімального депозиту
    const newMinDeposit = parseIRYS('0.005'); // 0.005 IRYS
    log(`   🔧 Зміна мінімального депозиту на ${formatIRYS(newMinDeposit)} IRYS...`);
    
    const ownerContract = contract.connect(playerWallet); // Власник - це деплоєр
    const updateTx = await ownerContract.updateMinDeposit(newMinDeposit);
    await updateTx.wait();
    
    const updatedMinDeposit = await contract.minDeposit();
    log(`   ✅ Мінімальний депозит оновлено: ${formatIRYS(updatedMinDeposit)} IRYS`);
    
    // Тестуємо паузу контракту
    log(`   ⏸️  Призупинення контракту...`);
    const pauseTx = await ownerContract.pause();
    await pauseTx.wait();
    
    const isPaused = await contract.paused();
    log(`   ✅ Контракт призупинено: ${isPaused}`);
    
    // Відновлюємо контракт
    log(`   ▶️  Відновлення контракту...`);
    const unpauseTx = await ownerContract.unpause();
    await unpauseTx.wait();
    
    const isUnpaused = await contract.paused();
    log(`   ✅ Контракт відновлено: ${!isUnpaused}`);
    
    log('✅ Тест 6 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 6 провалено: ${error.message}\\n`);
    return false;
  }
}

// Тест 7: Статистика контракту
async function testContractStats() {
  log('📊 Тест 7: Статистика контракту');
  
  try {
    const [totalDeposited, contractBalance] = await contract.getContractStats();
    const owner = await contract.owner();
    const serverWalletAddr = await contract.serverWallet();
    const minDeposit = await contract.minDeposit();
    const isPaused = await contract.paused();
    
    log(`   📈 Фінальна статистика контракту:`);
    log(`   ├── 👑 Власник: ${owner}`);
    log(`   ├── 🖥️  Серверний гаманець: ${serverWalletAddr}`);
    log(`   ├── 💰 Мінімальний депозит: ${formatIRYS(minDeposit)} IRYS`);
    log(`   ├── 📊 Загальна сума депозитів: ${formatIRYS(totalDeposited)} IRYS`);
    log(`   ├── 🏦 Баланс контракту: ${formatIRYS(contractBalance)} IRYS`);
    log(`   └── ⏸️  Стан: ${isPaused ? 'Призупинено' : 'Активний'}`);
    
    log('✅ Тест 7 пройдено успішно\\n');
    return true;
  } catch (error) {
    log(`❌ Тест 7 провалено: ${error.message}\\n`);
    return false;
  }
}

// Головна функція тестування
async function runAllTests() {
  log('🚀 Початок тестування SlotMachineBank контракту');
  log(`📍 Адреса контракту: ${process.env.CONTRACT_ADDRESS}`);
  log(`🔗 Мережа: ${process.env.IRYS_NETWORK}`);
  log(`👤 Гравець: ${playerWallet.address}`);
  log(`🖥️  Сервер: ${serverWallet.address}\\n`);
  
  const tests = [
    { name: 'Початковий стан', fn: testInitialState },
    { name: 'Депозит гравця', fn: testPlayerDeposit },
    { name: 'Імітація гри', fn: testGameSimulation },
    { name: 'Вивід коштів', fn: testPlayerWithdraw },
    { name: 'Множинні гравці', fn: testMultiplePlayers },
    { name: 'Адміністративні функції', fn: testAdminFunctions },
    { name: 'Статистика контракту', fn: testContractStats }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      await delay(1000); // Пауза між тестами
    } catch (error) {
      log(`❌ Критична помилка в тесті "${test.name}": ${error.message}\\n`);
      failed++;
    }
  }
  
  log('🏁 Тестування завершено!');
  log(`✅ Пройдено: ${passed}`);
  log(`❌ Провалено: ${failed}`);
  log(`📊 Загальний результат: ${passed}/${tests.length}`);
  
  if (failed === 0) {
    log('🎉 Всі тести пройдено успішно! Контракт готовий до використання.');
  } else {
    log('⚠️  Деякі тести провалено. Перевірте логи вище.');
  }
}

// Запуск тестів
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Критична помилка:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testInitialState,
  testPlayerDeposit,
  testGameSimulation,
  testPlayerWithdraw,
  testMultiplePlayers,
  testAdminFunctions,
  testContractStats
};