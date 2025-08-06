import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

// Функція для тестування системи черги
async function testQueueSystem() {
  console.log('🧪 Тестування системи черги транзакцій...\n');

  try {
    // Перевіряємо початкову статистику
    console.log('📊 Початкова статистика черги...');
    let queueResponse = await fetch(`${SERVER_URL}/api/queue/stats`);
    let queueData = await queueResponse.json();
    
    if (queueData.success) {
      console.log(`📥 Поточний розмір черги: ${queueData.data.currentQueueSize}`);
      console.log(`📈 Загалом в черзі було: ${queueData.data.totalQueued}`);
      console.log(`✅ Оброблено: ${queueData.data.totalProcessed}`);
    }

    // Симулюємо велику кількість одночасних запитів
    console.log('\n🚀 Симуляція 15 одночасних транзакцій...');
    
    const testAddress = '0x233c8C54F25734B744E522bdC1Eed9cbc8C97D0c';
    const promises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < 15; i++) {
      const gameResult = {
        playerAddress: testAddress,
        betAmount: 1,
        winAmount: i % 3 === 0 ? 2 : 0, // Кожна третя транзакція - виграш
        gameData: {
          fruit0: 'cherry',
          fruit1: 'cherry',
          fruit2: i % 3 === 0 ? 'cherry' : 'apple',
          timestamp: Date.now() + i // Унікальний timestamp
        }
      };

      const promise = fetch(`${SERVER_URL}/api/game/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameResult)
      }).then(res => res.json()).then(data => ({
        index: i,
        success: data.success,
        error: data.error,
        completedAt: Date.now()
      }));

      promises.push(promise);
      
      // Невелика затримка між запитами для реалістичності
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Моніторимо чергу під час обробки
    const monitorInterval = setInterval(async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/queue/stats`);
        const data = await response.json();
        if (data.success && data.data.currentQueueSize > 0) {
          console.log(`⏳ В черзі: ${data.data.currentQueueSize}, обробляється: ${data.data.isProcessingQueue ? 'ТАК' : 'НІ'}`);
        }
      } catch (error) {
        // Ігноруємо помилки моніторингу
      }
    }, 500);

    // Чекаємо завершення всіх транзакцій
    const results = await Promise.all(promises);
    clearInterval(monitorInterval);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n📋 Результати тестових транзакцій:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Успішних: ${successful}`);
    console.log(`❌ Невдалих: ${failed}`);
    console.log(`⏱️ Загальний час: ${totalTime}ms`);
    console.log(`📊 Середній час на транзакцію: ${Math.round(totalTime / results.length)}ms`);

    // Показуємо деталі невдалих транзакцій
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('\n❌ Деталі невдалих транзакцій:');
      failedResults.forEach(result => {
        console.log(`   Транзакція ${result.index + 1}: ${result.error}`);
      });
    }

    // Фінальна статистика черги
    console.log('\n📊 Фінальна статистика черги...');
    queueResponse = await fetch(`${SERVER_URL}/api/queue/stats`);
    queueData = await queueResponse.json();
    
    if (queueData.success) {
      console.log(`📥 Поточний розмір черги: ${queueData.data.currentQueueSize}`);
      console.log(`📈 Загалом в черзі було: ${queueData.data.totalQueued}`);
      console.log(`✅ Оброблено: ${queueData.data.totalProcessed}`);
      console.log(`⏱️ Середній час очікування: ${queueData.data.averageWaitTime}ms`);
      console.log(`⏱️ Максимальний час очікування: ${queueData.data.maxWaitTime}ms`);
      console.log(`📊 Використання черги: ${queueData.data.queueUtilization}`);
    }

    // Статистика гаманців
    console.log('\n👛 Статистика гаманців після тесту...');
    const walletResponse = await fetch(`${SERVER_URL}/api/wallets/stats`);
    const walletData = await walletResponse.json();
    
    if (walletData.success) {
      console.log(`📈 Загальна успішність: ${walletData.data.successRate}`);
      console.log(`📊 Загальних транзакцій: ${walletData.data.totalTransactions}`);
      
      walletData.data.wallets.forEach(wallet => {
        if (wallet.successCount > 0 || wallet.errorCount > 0) {
          console.log(`   ${wallet.name}: ${wallet.successCount} успішних, ${wallet.errorCount} помилок`);
        }
      });
    }

    console.log('\n🎉 Тест системи черги завершено!');

  } catch (error) {
    console.error('❌ Помилка тестування:', error.message);
  }
}

// Функція для тестування очищення черги
async function testQueueClear() {
  console.log('\n🧹 Тестування очищення черги...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/queue/clear`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${data.data.message}`);
    } else {
      console.log(`❌ Помилка: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Помилка очищення черги:', error.message);
  }
}

// Запускаємо тести
console.log('🎯 Запуск тестів системи черги...');
testQueueSystem().then(() => {
  console.log('\n' + '='.repeat(50));
  return testQueueClear();
});