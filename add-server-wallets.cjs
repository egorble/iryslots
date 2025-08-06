const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function addServerWallets() {
  console.log('🔑 Додавання серверних гаманців до контракту...\n');
  
  try {
    // Підключення до мережі
    const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
    const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('👛 Owner address:', ownerWallet.address);
    
    // Завантаження ABI контракту
    const contractABI = JSON.parse(
      fs.readFileSync('./artifacts/SlotMachineBank.abi.json', 'utf8')
    );
    
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractABI,
      ownerWallet
    );
    
    console.log('📍 Contract address:', process.env.CONTRACT_ADDRESS);
    
    // Перевіряємо поточні авторизовані гаманці
    console.log('📋 Поточні авторизовані гаманці:');
    const currentServers = await contract.getAuthorizedServers();
    currentServers.forEach((server, index) => {
      console.log(`   ${index + 1}. ${server}`);
    });
    
    // Гаманці для додавання
    const walletsToAdd = [
      {
        name: 'SERVER_WALLET_2',
        key: process.env.SERVER_WALLET_KEY_2
      },
      {
        name: 'SERVER_WALLET_3', 
        key: process.env.SERVER_WALLET_KEY_3
      },
      {
        name: 'SERVER_WALLET_4',
        key: process.env.SERVER_WALLET_KEY_4
      }
    ];
    
    console.log('\n🚀 Додавання нових серверних гаманців...');
    
    for (const walletInfo of walletsToAdd) {
      if (!walletInfo.key) {
        console.log(`⚠️  ${walletInfo.name}: приватний ключ не встановлений, пропускаємо`);
        continue;
      }
      
      try {
        const wallet = new ethers.Wallet(walletInfo.key);
        const walletAddress = wallet.address;
        
        console.log(`\n🔄 Додавання ${walletInfo.name} (${walletAddress})...`);
        
        // Перевіряємо, чи вже авторизований
        const isAlreadyAuthorized = await contract.isAuthorizedServer(walletAddress);
        if (isAlreadyAuthorized) {
          console.log(`   ✅ Вже авторизований, пропускаємо`);
          continue;
        }
        
        // Додаємо гаманець
        const tx = await contract.addServerWallet(walletAddress);
        console.log(`   ⏳ Очікування підтвердження транзакції...`);
        console.log(`   🔗 Хеш транзакції: ${tx.hash}`);
        
        await tx.wait();
        console.log(`   ✅ ${walletInfo.name} успішно додано!`);
        
      } catch (error) {
        console.log(`   ❌ Помилка додавання ${walletInfo.name}: ${error.message}`);
      }
    }
    
    // Перевіряємо фінальний список
    console.log('\n📋 Фінальний список авторизованих гаманців:');
    const finalServers = await contract.getAuthorizedServers();
    finalServers.forEach((server, index) => {
      console.log(`   ${index + 1}. ${server}`);
    });
    
    console.log(`\n✅ Загалом авторизовано ${finalServers.length} серверних гаманців`);
    console.log('🎉 Налаштування завершено! Тепер всі гаманці можуть виконувати транзакції.');
    
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  }
}

// Запуск
addServerWallets();