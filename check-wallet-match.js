import { ethers } from 'ethers';

// Перевіряємо відповідність приватних ключів та адрес
const wallets = [
  {
    name: 'SERVER_WALLET (основний)',
    key: '889cbda80f8af5cff705746ae8d5dc56d9786dba50783c1093a84d680cc7e8da',
    expectedAddress: '0x4Bf3593aE21739f6c16b8ef67c0C2113d1543BE7'
  },
  {
    name: 'SERVER_WALLET_2',
    key: 'edabba43651eecaa950825f7d4a3a3d528a585f531bba6079f617bf8309fc438',
    expectedAddress: '0x932Ea99049f116FE20a8B3De30E7fDa93677676E'
  },
  {
    name: 'SERVER_WALLET_3',
    key: '5f6b9160c101a1b56fe35fb1ce93b15fc450db6424922ee0bc6aaeaf068b8446',
    expectedAddress: '0x3Ba975D45c4F990815c2fB68a90a708731a3F357'
  },
  {
    name: 'SERVER_WALLET_4',
    key: '5f7ca8d83c2efc1386d1b3d0cb50671e518e08fab2500933cd79f7181fc95866',
    expectedAddress: '0xb8795178829201ba55a4Cd0963e2348261D65f5a'
  }
];

console.log('🔍 Перевірка відповідності приватних ключів та адрес:\n');

wallets.forEach(walletInfo => {
  try {
    const wallet = new ethers.Wallet(walletInfo.key);
    const actualAddress = wallet.address;
    const matches = actualAddress.toLowerCase() === walletInfo.expectedAddress.toLowerCase();
    
    console.log(`${walletInfo.name}:`);
    console.log(`  Очікувана адреса: ${walletInfo.expectedAddress}`);
    console.log(`  Фактична адреса:  ${actualAddress}`);
    console.log(`  Відповідність:    ${matches ? '✅ ТАК' : '❌ НІ'}`);
    console.log('');
  } catch (error) {
    console.log(`${walletInfo.name}: ❌ Помилка - ${error.message}\n`);
  }
});

// Перевіряємо, який гаманець використовується в контракті
console.log('📋 Інформація про контракт:');
console.log(`Контракт адреса: 0xA88ce26B2895a27b26ab92d5F179d99Ac4D75CC1`);
console.log(`Авторизований serverWallet: 0x4Bf3593aE21739f6c16b8ef67c0C2113d1543BE7`);