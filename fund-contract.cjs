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

async function fundContract() {
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
    
    // Сума для поповнення (можна змінити)
    const fundAmount = parseIRYS('10.0'); // 1 IRYS
    
    if (senderBalance < fundAmount) {
      console.error(`❌ Недостатньо коштів. Потрібно: ${formatIRYS(fundAmount)} IRYS`);
      process.exit(1);
    }
    
    console.log(`📤 Відправка ${formatIRYS(fundAmount)} IRYS на контракт...`);
    
    // Відправляємо кошти на контракт
    const tx = await wallet.sendTransaction({
      to: process.env.CONTRACT_ADDRESS,
      value: fundAmount,
      gasLimit: 50000 // Більше газу для receive() функції контракту
    });
    
    console.log(`⏳ Транзакція відправлена: ${tx.hash}`);
    
    // Очікуємо підтвердження
    const receipt = await tx.wait();
    console.log(`✅ Транзакція підтверджена в блоці: ${receipt.blockNumber}`);
    
    // Перевіряємо новий баланс контракту
    const contractBalanceAfter = await provider.getBalance(process.env.CONTRACT_ADDRESS);
    console.log(`🏦 Новий баланс контракту: ${formatIRYS(contractBalanceAfter)} IRYS`);
    
    const increase = contractBalanceAfter - contractBalanceBefore;
    console.log(`📈 Збільшення: ${formatIRYS(increase)} IRYS`);
    
    console.log('🎉 Фонд контракту успішно поповнено!');
    
  } catch (error) {
    console.error('❌ Помилка поповнення фонду:', error.message);
    process.exit(1);
  }
}

// Запуск поповнення
if (require.main === module) {
  fundContract().catch(console.error);
}

module.exports = { fundContract };