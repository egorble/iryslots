const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Налаштування мережі
const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Завантажуємо ABI контракту
const contractABI = JSON.parse(
  fs.readFileSync('./artifacts/SlotMachineBank.abi.json', 'utf8')
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  ownerWallet
);

function formatIRYS(wei) {
  return ethers.formatEther(wei);
}

function parseIRYS(amount) {
  return ethers.parseEther(amount.toString());
}

async function checkOwnership() {
  try {
    const contractOwner = await contract.owner();
    const currentAddress = ownerWallet.address;
    
    console.log(`🔐 Власник контракту: ${contractOwner}`);
    console.log(`👤 Поточний адрес: ${currentAddress}`);
    
    if (contractOwner.toLowerCase() !== currentAddress.toLowerCase()) {
      throw new Error('❌ Ви не є власником контракту!');
    }
    
    console.log('✅ Підтверджено права власника');
    return true;
  } catch (error) {
    console.error('❌ Помилка перевірки прав:', error.message);
    return false;
  }
}

async function getContractStats() {
  try {
    const [totalDeposited, contractBalance] = await contract.getContractStats();
    const minDeposit = await contract.minDeposit();
    const isPaused = await contract.paused();
    
    console.log('\n📊 Статистика контракту:');
    console.log(`💰 Загальний баланс: ${formatIRYS(contractBalance)} IRYS`);
    console.log(`📥 Всього депозитів: ${formatIRYS(totalDeposited)} IRYS`);
    console.log(`💎 Мінімальний депозит: ${formatIRYS(minDeposit)} IRYS`);
    console.log(`⏸️ Призупинено: ${isPaused ? 'Так' : 'Ні'}`);
    
    return {
      contractBalance,
      totalDeposited,
      minDeposit,
      isPaused
    };
  } catch (error) {
    console.error('❌ Помилка отримання статистики:', error.message);
    throw error;
  }
}

async function emergencyWithdraw(amount) {
  console.log(`💸 Екстрене виведення ${amount} IRYS з контракту...`);
  
  try {
    // Перевіряємо права власника
    const hasRights = await checkOwnership();
    if (!hasRights) {
      process.exit(1);
    }
    
    // Отримуємо статистику
    const stats = await getContractStats();
    
    const withdrawAmount = parseIRYS(amount);
    
    // Перевіряємо чи достатньо коштів
    if (stats.contractBalance < withdrawAmount) {
      console.error(`❌ Недостатньо коштів в контракті!`);
      console.error(`💰 Доступно: ${formatIRYS(stats.contractBalance)} IRYS`);
      console.error(`💸 Запитано: ${amount} IRYS`);
      process.exit(1);
    }
    
    // Перевіряємо баланс власника для газу
    const ownerBalance = await provider.getBalance(ownerWallet.address);
    console.log(`💳 Баланс власника: ${formatIRYS(ownerBalance)} IRYS`);
    
    if (ownerBalance < parseIRYS('0.01')) {
      console.error('❌ Недостатньо коштів для оплати газу!');
      process.exit(1);
    }
    
    console.log(`📤 Виведення ${amount} IRYS...`);
    
    // Викликаємо emergencyWithdraw
    const tx = await contract.emergencyWithdraw(withdrawAmount, {
      gasLimit: 100000
    });
    
    console.log(`⏳ Транзакція відправлена: ${tx.hash}`);
    
    // Очікуємо підтвердження
    const receipt = await tx.wait();
    console.log(`✅ Транзакція підтверджена в блоці: ${receipt.blockNumber}`);
    console.log(`⛽ Використано газу: ${receipt.gasUsed.toString()}`);
    
    // Перевіряємо нові баланси
    const newContractBalance = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    const newOwnerBalance = await provider.getBalance(ownerWallet.address);
    
    console.log(`\n📊 Результат виведення:`);
    console.log(`🏦 Новий баланс контракту: ${formatIRYS(newContractBalance)} IRYS`);
    console.log(`👤 Новий баланс власника: ${formatIRYS(newOwnerBalance)} IRYS`);
    console.log(`📈 Виведено: ${amount} IRYS`);
    
    console.log('🎉 Кошти успішно виведено!');
    
    return {
      txHash: tx.hash,
      amount: amount,
      newContractBalance: formatIRYS(newContractBalance),
      newOwnerBalance: formatIRYS(newOwnerBalance)
    };
    
  } catch (error) {
    console.error('❌ Помилка виведення коштів:', error.message);
    
    // Детальна інформація про помилки
    if (error.message?.includes('InsufficientContractBalance')) {
      console.error('💡 Причина: Недостатньо коштів в контракті');
    } else if (error.message?.includes('OnlyOwner')) {
      console.error('💡 Причина: Тільки власник може виводити кошти');
    } else if (error.message?.includes('AmountTooSmall')) {
      console.error('💡 Причина: Сума занадто мала (повинна бути > 0)');
    }
    
    throw error;
  }
}

async function withdrawAll() {
  console.log('💸 Виведення всіх коштів з контракту...');
  
  try {
    const stats = await getContractStats();
    const allAmount = formatIRYS(stats.contractBalance);
    
    if (parseFloat(allAmount) === 0) {
      console.log('💰 Контракт порожній, нічого виводити');
      return;
    }
    
    console.log(`💰 Виводимо всі кошти: ${allAmount} IRYS`);
    
    // Підтвердження
    console.log('\n⚠️  УВАГА: Ви збираєтесь вивести ВСІ кошти з контракту!');
    console.log('⚠️  Це може зробити гру недоступною для гравців!');
    
    return await emergencyWithdraw(allAmount);
    
  } catch (error) {
    console.error('❌ Помилка виведення всіх коштів:', error.message);
    throw error;
  }
}

// Функція для часткового виведення (залишити резерв)
async function withdrawPartial(leaveAmount = '1.0') {
  console.log(`💸 Часткове виведення (залишити ${leaveAmount} IRYS)...`);
  
  try {
    const stats = await getContractStats();
    const currentBalance = parseFloat(formatIRYS(stats.contractBalance));
    const leaveAmountFloat = parseFloat(leaveAmount);
    
    if (currentBalance <= leaveAmountFloat) {
      console.log(`💰 Поточний баланс (${currentBalance} IRYS) менший або рівний резерву (${leaveAmount} IRYS)`);
      console.log('❌ Нічого виводити');
      return;
    }
    
    const withdrawAmount = (currentBalance - leaveAmountFloat).toFixed(6);
    console.log(`💰 Виводимо: ${withdrawAmount} IRYS`);
    console.log(`💎 Залишаємо: ${leaveAmount} IRYS`);
    
    return await emergencyWithdraw(withdrawAmount);
    
  } catch (error) {
    console.error('❌ Помилка часткового виведення:', error.message);
    throw error;
  }
}

// Запуск
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'stats') {
    // Показати статистику: node withdraw-from-contract.cjs stats
    getContractStats().catch(console.error);
  } else if (command === 'all') {
    // Вивести все: node withdraw-from-contract.cjs all
    withdrawAll().catch(console.error);
  } else if (command === 'partial') {
    // Часткове виведення: node withdraw-from-contract.cjs partial 2.0
    const leaveAmount = args[1] || '1.0';
    withdrawPartial(leaveAmount).catch(console.error);
  } else if (command && !isNaN(parseFloat(command))) {
    // Вивести конкретну суму: node withdraw-from-contract.cjs 5.0
    emergencyWithdraw(command).catch(console.error);
  } else {
    console.log('📖 Використання:');
    console.log('  node withdraw-from-contract.cjs stats           - показати статистику');
    console.log('  node withdraw-from-contract.cjs 5.0             - вивести 5.0 IRYS');
    console.log('  node withdraw-from-contract.cjs all             - вивести все');
    console.log('  node withdraw-from-contract.cjs partial 2.0     - вивести все, залишити 2.0 IRYS');
  }
}

module.exports = { 
  emergencyWithdraw, 
  withdrawAll, 
  withdrawPartial, 
  getContractStats, 
  checkOwnership 
};