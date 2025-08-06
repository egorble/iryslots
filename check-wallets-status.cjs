const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function checkWalletsStatus() {
  console.log('🔍 Перевірка статусу всіх серверних гаманців...\n');
  
  try {
    // Підключення до мережі
    const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
    
    // Завантаження ABI контракту
    const contractABI = JSON.parse(
      fs.readFileSync('./artifacts/SlotMachineBank.abi.json', 'utf8')
    );
    
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractABI,
      provider
    );
    
    console.log('📍 Contract address:', process.env.CONTRACT_ADDRESS);
    console.log('🔗 Network:', process.env.IRYS_NETWORK);
    
    // Отримуємо авторизовані гаманці з контракту
    const authorizedServers = await contract.getAuthorizedServers();
    console.log(`\n✅ Авторизовані гаманці в контракті (${authorizedServers.length}):`);
    authorizedServers.forEach((server, index) => {
      console.log(`   ${index + 1}. ${server}`);
    });
    
    // Перевіряємо наші гаманці з .env
    const ourWallets = [
      {
        name: 'SERVER_WALLET (Primary)',
        key: process.env.SERVER_WALLET_KEY
      },
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
    
    console.log('\n🔑 Статус наших серверних гаманців:');
    let authorizedCount = 0;
    
    for (const walletInfo of ourWallets) {
      if (!walletInfo.key) {
        console.log(`\n❌ ${walletInfo.name}: приватний ключ не встановлений`);
        continue;
      }
      
      try {
        const wallet = new ethers.Wallet(walletInfo.key);
        const address = wallet.address;
        const balance = await provider.getBalance(address);
        const isAuthorized = await contract.isAuthorizedServer(address);
        
        console.log(`\n${isAuthorized ? '✅' : '❌'} ${walletInfo.name}:`);
        console.log(`   Адреса:        ${address}`);
        console.log(`   Баланс:        ${ethers.formatEther(balance)} IRYS`);
        console.log(`   Авторизований: ${isAuthorized ? 'ТАК' : 'НІ'}`);
        
        if (isAuthorized) {
          authorizedCount++;
        }
        
      } catch (error) {
        console.log(`\n❌ ${walletInfo.name}: помилка - ${error.message}`);
      }
    }
    
    console.log('\n📊 Підсумок:');
    console.log(`   Авторизовано в контракті: ${authorizedServers.length} гаманців`);
    console.log(`   Наших авторизованих:      ${authorizedCount} з ${ourWallets.length}`);
    console.log(`   Готовність до роботи:     ${authorizedCount >= 2 ? '✅ ТАК' : '❌ НІ'}`);
    
    if (authorizedCount < 2) {
      console.log('\n⚠️  Рекомендації:');
      console.log('   - Переконайтеся, що всі приватні ключі правильно встановлені в .env');
      console.log('   - Запустіть: node add-server-wallets.cjs');
      console.log('   - Перевірте баланси гаманців для оплати газу');
    } else {
      console.log('\n🎉 Система готова до роботи з балансуванням навантаження!');
    }
    
  } catch (error) {
    console.error('❌ Помилка перевірки:', error.message);
    process.exit(1);
  }
}

// Запуск
checkWalletsStatus();