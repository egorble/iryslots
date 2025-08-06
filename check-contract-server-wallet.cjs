const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function checkContractServerWallet() {
  console.log('🔍 Перевірка авторизованого serverWallet в контракті...\n');
  
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
    
    // Отримуємо поточний serverWallet з контракту
    const contractServerWallet = await contract.serverWallet();
    console.log('📋 Авторизований serverWallet в контракті:', contractServerWallet);
    
    // Перевіряємо всі наші гаманці
    const ourWallets = [
      {
        name: 'SERVER_WALLET (основний)',
        key: process.env.SERVER_WALLET_KEY,
        envAddress: process.env.SERVER_WALLET_ADDRESS
      },
      {
        name: 'SERVER_WALLET_2',
        key: process.env.SERVER_WALLET_KEY_2,
        envAddress: process.env.SERVER_WALLET_ADDRESS_2
      },
      {
        name: 'SERVER_WALLET_3',
        key: process.env.SERVER_WALLET_KEY_3,
        envAddress: process.env.SERVER_WALLET_ADDRESS_3
      },
      {
        name: 'SERVER_WALLET_4',
        key: process.env.SERVER_WALLET_KEY_4,
        envAddress: process.env.SERVER_WALLET_ADDRESS_4
      }
    ];
    
    console.log('\n🔑 Наші серверні гаманці:');
    let authorizedWallet = null;
    
    ourWallets.forEach(walletInfo => {
      if (walletInfo.key) {
        try {
          const wallet = new ethers.Wallet(walletInfo.key);
          const actualAddress = wallet.address;
          const isAuthorized = actualAddress.toLowerCase() === contractServerWallet.toLowerCase();
          
          console.log(`\n${walletInfo.name}:`);
          console.log(`  Адреса з .env:     ${walletInfo.envAddress || 'не встановлена'}`);
          console.log(`  Фактична адреса:   ${actualAddress}`);
          console.log(`  Авторизований:     ${isAuthorized ? '✅ ТАК' : '❌ НІ'}`);
          
          if (isAuthorized) {
            authorizedWallet = walletInfo;
          }
        } catch (error) {
          console.log(`\n${walletInfo.name}: ❌ Помилка - ${error.message}`);
        }
      } else {
        console.log(`\n${walletInfo.name}: ❌ Приватний ключ не встановлений`);
      }
    });
    
    console.log('\n📊 Результат:');
    if (authorizedWallet) {
      console.log(`✅ Авторизований гаманець знайдено: ${authorizedWallet.name}`);
      console.log('💡 Рішення: Використовувати тільки цей гаманець або оновити serverWallet в контракті');
    } else {
      console.log('❌ Жоден з наших гаманців не авторизований в контракті!');
      console.log('💡 Рішення: Потрібно оновити serverWallet в контракті на один з наших гаманців');
    }
    
  } catch (error) {
    console.error('❌ Помилка перевірки:', error.message);
  }
}

// Запуск
checkContractServerWallet();