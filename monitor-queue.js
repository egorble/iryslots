import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

// Функція для моніторингу черги в реальному часі
async function monitorQueue() {
  console.log('📊 Моніторинг черги транзакцій в реальному часі...');
  console.log('Натисніть Ctrl+C для зупинки\n');

  let previousStats = null;

  const monitor = async () => {
    try {
      // Отримуємо статистику черги
      const queueResponse = await fetch(`${SERVER_URL}/api/queue/stats`);
      const queueData = await queueResponse.json();

      // Отримуємо статистику гаманців
      const walletResponse = await fetch(`${SERVER_URL}/api/wallets/stats`);
      const walletData = await walletResponse.json();

      if (queueData.success && walletData.success) {
        const queue = queueData.data;
        const wallets = walletData.data;

        // Очищаємо консоль для оновлення
        console.clear();
        console.log('📊 Моніторинг черги транзакцій в реальному часі...');
        console.log('Натисніть Ctrl+C для зупинки\n');

        // Статистика гаманців
        console.log('👛 Статус гаманців:');
        console.log(`   Доступно: ${wallets.availableWallets}/${wallets.totalWallets}`);
        console.log(`   Обробляють: ${wallets.processingWallets}`);
        console.log(`   Успішність: ${wallets.successRate}`);

        // Статистика черги
        console.log('\n📥 Статус черги:');
        console.log(`   В черзі зараз: ${queue.currentQueueSize}/${queue.maxQueueSize}`);
        console.log(`   Використання: ${queue.queueUtilization}`);
        console.log(`   Обробляється: ${queue.isProcessingQueue ? '✅ ТАК' : '❌ НІ'}`);

        if (queue.totalQueued > 0) {
          console.log(`   Загалом в черзі було: ${queue.totalQueued}`);
          console.log(`   Оброблено: ${queue.totalProcessed}`);
          console.log(`   Середній час очікування: ${queue.averageWaitTime}ms`);
          console.log(`   Максимальний час очікування: ${queue.maxWaitTime}ms`);
        }

        // Показуємо зміни
        if (previousStats) {
          const queueChange = queue.currentQueueSize - previousStats.queue.currentQueueSize;
          const processedChange = queue.totalProcessed - previousStats.queue.totalProcessed;

          if (queueChange !== 0 || processedChange !== 0) {
            console.log('\n📈 Зміни:');
            if (queueChange > 0) {
              console.log(`   📥 +${queueChange} в чергу`);
            } else if (queueChange < 0) {
              console.log(`   📤 ${Math.abs(queueChange)} з черги`);
            }
            if (processedChange > 0) {
              console.log(`   ✅ +${processedChange} оброблено`);
            }
          }
        }

        // Деталі по гаманцях
        console.log('\n🔍 Деталі гаманців:');
        wallets.wallets.forEach(wallet => {
          const status = wallet.isProcessing ? '🔄 Обробляє' : 
                        wallet.isAvailable ? '✅ Доступний' : '❌ Недоступний';
          console.log(`   ${wallet.name}: ${status} (${wallet.successCount}✅/${wallet.errorCount}❌)`);
        });

        console.log(`\n🕐 Останнє оновлення: ${new Date().toLocaleTimeString()}`);

        previousStats = {
          queue: { ...queue },
          wallets: { ...wallets }
        };
      }
    } catch (error) {
      console.error('❌ Помилка моніторингу:', error.message);
    }
  };

  // Початковий запуск
  await monitor();

  // Оновлення кожні 2 секунди
  const interval = setInterval(monitor, 2000);

  // Обробка Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\n👋 Моніторинг зупинено');
    process.exit(0);
  });
}

// Запуск моніторингу
monitorQueue();