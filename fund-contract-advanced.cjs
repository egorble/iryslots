const { ethers } = require('ethers');
require('dotenv').config();

// Налаштування мережі
const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

function formatIRYS(wei) {
  return ethers.formatEther(wei);
}

function parseIRYS(amount) {
  return ethers.parseEther(amount.toString());
}

async function fundContract(amount = '1.0') {
  console.log('💰 Поповнення фонду контракту...');
  console.log(`📍 Адреса контракту: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`👤 Відправник: ${wallet.address}`);
  
  try {
    // Перевіряємо баланс відправника
    const senderBalance = await provider.getBalance(wallet.address);
    console.log(`💳 Баланс відправника: ${formatIRYS(senderBalance)} IRYS`);
    
    // Перевіряємо поточний баланс контракту
    const contractBalanceBefore = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    console.log(`🏦 Поточний баланс контракту: ${formatIRYS(contractBalanceBefore)} IRYS`);
    
    // Сума для поповнення
    const fundAmount = parseIRYS(amount);
    
    if (senderBalance < fundAmount) {
      console.error(`❌ Недостатньо коштів. Потрібно: ${formatIRYS(fundAmount)} IRYS`);
      process.exit(1);
    }
    
    console.log(`📤 Відправка ${formatIRYS(fundAmount)} IRYS на контракт...`);
    
    // Відправляємо кошти на контракт (використовуємо receive() функцію)
    const tx = await wallet.sendTransaction({
      to: process.env.CONTRACT_ADDRESS,
      value: fundAmount,
      gasLimit: 50000 // Трохи більше газу для receive()
    });
    
    console.log(`⏳ Транзакція відправлена: ${tx.hash}`);
    
    // Очікуємо підтвердження
    const receipt = await tx.wait();
    console.log(`✅ Транзакція підтверджена в блоці: ${receipt.blockNumber}`);
    console.log(`⛽ Використано газу: ${receipt.gasUsed.toString()}`);
    
    // Перевіряємо новий баланс контракту
    const contractBalanceAfter = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    console.log(`🏦 Новий баланс контракту: ${formatIRYS(contractBalanceAfter)} IRYS`);
    
    const increase = contractBalanceAfter - contractBalanceBefore;
    console.log(`📈 Збільшення: ${formatIRYS(increase)} IRYS`);
    
    console.log('🎉 Фонд контракту успішно поповнено!');
    
    return {
      txHash: tx.hash,
      amount: formatIRYS(fundAmount),
      newBalance: formatIRYS(contractBalanceAfter)
    };
    
  } catch (error) {
    console.error('❌ Помилка поповнення фонду:', error.message);
    throw error;
  }
}

// Функція для масового поповнення
async function bulkFund(amounts) {
  console.log('🔄 Масове поповнення фонду...');
  
  for (let i = 0; i < amounts.length; i++) {
    console.log(`\n--- Поповнення ${i + 1}/${amounts.length} ---`);
    try {
      await fundContract(amounts[i]);
      console.log(`✅ Поповнення ${amounts[i]} IRYS завершено`);
      
      // Пауза між транзакціями
      if (i < amounts.length - 1) {
        console.log('⏳ Очікування 5 секунд...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`❌ Помилка поповнення ${amounts[i]} IRYS:`, error.message);
    }
  }
}

// Запуск
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'bulk') {
    // Масове поповнення: node fund-contract-advanced.cjs bulk 1.0 2.0 0.5
    const amounts = args.slice(1);
    if (amounts.length === 0) {
      console.error('❌ Вкажіть суми для масового поповнення');
      process.exit(1);
    }
    bulkFund(amounts).catch(console.error);
  } else {
    // Одиночне поповнення: node fund-contract-advanced.cjs 5.0
    const amount = args[0] || '1.0';
    fundContract(amount).catch(console.error);
  }
}

module.exports = { fundContract, bulkFund };