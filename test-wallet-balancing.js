import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

// Функція для тестування балансування навантаження
async function testWalletBalancing() {
  console.log('🧪 Тестування балансування навантаження гаманців...\n');

  try {
    // Перевіряємо статистику гаманців
    console.log('📊 Отримання статистики гаманців...');
    const statsResponse = await fetch(`${SERVER_URL}/api/wallets/stats`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log(`✅ Загалом гаманців: ${statsData.data.totalWallets}`);
      console.log(`🟢 Доступних: ${statsData.data.availableWallets}`);
      console.log(`🔄 Обробляють: ${statsData.data.processingWallets}`);
      console.log(`📈 Успішність: ${statsData.data.successRate}`);
      
      console.log('\n👛 Деталі гаманців:');
      statsData.data.wallets.forEach(wallet => {
        console.log(`   ${wallet.name}: ${wallet.address}`);
        console.log(`      Доступний: ${wallet.isAvailable ? '✅' : '❌'}`);
        console.log(`      Обробляє: ${wallet.isProcessing ? '🔄' : '⏸️'}`);
        console.log(`      Успішних: ${wallet.successCount}, Помилок: ${wallet.errorCount}`);
        console.log('');
      });
    } else {
      console.error('❌ Помилка отримання статистики:', statsData.error);
    }

    // Симулюємо кілька одночасних запитів для тестування балансування
    console.log('🚀 Симуляція одночасних транзакцій...');
    
    const testAddress = '0x233c8C54F25734B744E522bdC1Eed9cbc8C97D0c'; // Використовуємо реальний адрес
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      const gameResult = {
        playerAddress: testAddress,
        betAmount: 1,
        winAmount: i % 2 === 0 ? 2 : 0, // Чергуємо виграші та програші
        gameData: {
          fruit0: 'cherry',
          fruit1: 'cherry',
          fruit2: i % 2 === 0 ? 'cherry' : 'apple',
          timestamp: Date.now()
        }
      };

      promises.push(
        fetch(`${SERVER_URL}/api/game/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gameResult)
        }).then(res => res.json()).then(data => ({
          index: i,
          success: data.success,
          error: data.error
        }))
      );
    }

    const results = await Promise.all(promises);
    
    console.log('\n📋 Результати тестових транзакцій:');
    results.forEach(result => {
      console.log(`   Транзакція ${result.index + 1}: ${result.success ? '✅ Успішно' : '❌ Помилка - ' + result.error}`);
    });

    // Отримуємо оновлену статистику
    console.log('\n📊 Оновлена статистика після тестів...');
    const finalStatsResponse = await fetch(`${SERVER_URL}/api/wallets/stats`);
    const finalStatsData = await finalStatsResponse.json();
    
    if (finalStatsData.success) {
      console.log(`📈 Фінальна успішність: ${finalStatsData.data.successRate}`);
      console.log(`📊 Загальних транзакцій: ${finalStatsData.data.totalTransactions}`);
      
      finalStatsData.data.wallets.forEach(wallet => {
        if (wallet.successCount > 0 || wallet.errorCount > 0) {
          console.log(`   ${wallet.name}: ${wallet.successCount} успішних, ${wallet.errorCount} помилок`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Помилка тестування:', error.message);
  }
}

// Запускаємо тест
testWalletBalancing();