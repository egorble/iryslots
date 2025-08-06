import { ethers } from 'ethers';
import winston from 'winston';

class WalletManager {
  constructor(provider, contractABI, contractAddress, logger) {
    this.provider = provider;
    this.contractABI = contractABI;
    this.contractAddress = contractAddress;
    this.logger = logger;
    
    // Ініціалізуємо гаманці з .env
    this.wallets = [];
    this.walletStatus = new Map(); // Відстежуємо статус кожного гаманця
    this.currentWalletIndex = 0;
    
    // Система черги для запитів
    this.transactionQueue = [];
    this.isProcessingQueue = false;
    this.maxQueueSize = 100; // Максимальний розмір черги
    this.queueStats = {
      totalQueued: 0,
      totalProcessed: 0,
      currentQueueSize: 0,
      maxWaitTime: 0,
      averageWaitTime: 0
    };
    
    this.initializeWallets();
    this.startQueueProcessor();
  }

  initializeWallets() {
    const walletConfigs = [
      {
        key: process.env.SERVER_WALLET_KEY,
        name: 'Wallet-1 (Primary)'
      },
      {
        key: process.env.SERVER_WALLET_KEY_2,
        name: 'Wallet-2'
      },
      {
        key: process.env.SERVER_WALLET_KEY_3,
        name: 'Wallet-3'
      },
      {
        key: process.env.SERVER_WALLET_KEY_4,
        name: 'Wallet-4'
      }
    ];

    walletConfigs.forEach((config, index) => {
      if (config.key) {
        try {
          const wallet = new ethers.Wallet(config.key, this.provider);
          const contract = new ethers.Contract(
            this.contractAddress,
            this.contractABI,
            wallet
          );
          
          this.wallets.push({
            wallet,
            contract,
            name: config.name,
            index,
            isProcessing: false,
            lastUsed: 0,
            errorCount: 0
          });
          
          this.walletStatus.set(index, {
            isAvailable: true,
            isProcessing: false,
            lastError: null,
            successCount: 0,
            errorCount: 0
          });
          
          this.logger.info(`✅ Ініціалізовано ${config.name}: ${wallet.address}`);
        } catch (error) {
          this.logger.error(`❌ Помилка ініціалізації ${config.name}:`, error);
        }
      }
    });

    this.logger.info(`🎯 Загалом ініціалізовано ${this.wallets.length} гаманців`);
  }

  // Отримати доступний гаманець (round-robin з перевіркою доступності)
  getAvailableWallet() {
    if (this.wallets.length === 0) {
      throw new Error('Немає доступних гаманців');
    }

    // Спочатку шукаємо гаманець, який не обробляє транзакцію
    for (let i = 0; i < this.wallets.length; i++) {
      const walletIndex = (this.currentWalletIndex + i) % this.wallets.length;
      const walletInfo = this.wallets[walletIndex];
      const status = this.walletStatus.get(walletIndex);

      if (status.isAvailable && !walletInfo.isProcessing) {
        this.currentWalletIndex = (walletIndex + 1) % this.wallets.length;
        return walletInfo;
      }
    }

    // Якщо всі гаманці зайняті, повертаємо null (буде додано в чергу)
    return null;
  }

  // Додати транзакцію в чергу
  addToQueue(transactionFunction, args, resolve, reject) {
    if (this.transactionQueue.length >= this.maxQueueSize) {
      const error = new Error(`Черга переповнена (максимум ${this.maxQueueSize} запитів)`);
      this.logger.error('❌ Черга переповнена:', error.message);
      reject(error);
      return;
    }

    const queueItem = {
      id: Date.now() + Math.random(), // Унікальний ID
      transactionFunction,
      args,
      resolve,
      reject,
      queuedAt: Date.now(),
      priority: 0 // Можна додати пріоритети пізніше
    };

    this.transactionQueue.push(queueItem);
    this.queueStats.totalQueued++;
    this.queueStats.currentQueueSize = this.transactionQueue.length;

    this.logger.info(`📥 Транзакцію додано в чергу (ID: ${queueItem.id.toString().slice(-6)}, позиція: ${this.transactionQueue.length})`);
  }

  // Обробник черги (працює постійно)
  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 100); // Перевіряємо чергу кожні 100мс
  }

  // Обробити чергу
  async processQueue() {
    if (this.isProcessingQueue || this.transactionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Обробляємо всі доступні транзакції
      while (this.transactionQueue.length > 0) {
        const availableWallet = this.getAvailableWallet();
        if (!availableWallet) {
          // Немає доступних гаманців, чекаємо
          break;
        }

        const queueItem = this.transactionQueue.shift();
        this.queueStats.currentQueueSize = this.transactionQueue.length;

        // Розраховуємо час очікування
        const waitTime = Date.now() - queueItem.queuedAt;
        this.queueStats.maxWaitTime = Math.max(this.queueStats.maxWaitTime, waitTime);
        this.queueStats.averageWaitTime = (this.queueStats.averageWaitTime + waitTime) / 2;

        this.logger.info(`🚀 Обробка транзакції з черги (ID: ${queueItem.id.toString().slice(-6)}, очікування: ${waitTime}ms)`);

        // Виконуємо транзакцію асинхронно
        this.executeTransactionWithWallet(availableWallet, queueItem)
          .then(result => {
            this.queueStats.totalProcessed++;
            queueItem.resolve(result);
          })
          .catch(error => {
            queueItem.reject(error);
          });
      }
    } catch (error) {
      this.logger.error('❌ Помилка обробки черги:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Виконати транзакцію з конкретним гаманцем
  async executeTransactionWithWallet(walletInfo, queueItem) {
    const startTime = Date.now();
    this.markWalletAsBusy(walletInfo);

    try {
      const result = await queueItem.transactionFunction(walletInfo.contract, ...queueItem.args);
      const duration = Date.now() - startTime;
      
      this.logger.info(`✅ Транзакція з черги успішна через ${walletInfo.name} за ${duration}ms`);
      this.markWalletAsFree(walletInfo, true);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Помилка транзакції з черги через ${walletInfo.name} за ${duration}ms:`, error.message);
      this.markWalletAsFree(walletInfo, false);
      throw error;
    }
  }

  // Позначити гаманець як зайнятий
  markWalletAsBusy(walletInfo) {
    walletInfo.isProcessing = true;
    walletInfo.lastUsed = Date.now();
    
    const status = this.walletStatus.get(walletInfo.index);
    status.isProcessing = true;
    
    this.logger.debug(`🔒 ${walletInfo.name} позначено як зайнятий`);
  }

  // Позначити гаманець як вільний
  markWalletAsFree(walletInfo, success = true) {
    walletInfo.isProcessing = false;
    
    const status = this.walletStatus.get(walletInfo.index);
    status.isProcessing = false;
    
    if (success) {
      status.successCount++;
      status.lastError = null;
      walletInfo.errorCount = 0;
    } else {
      status.errorCount++;
      walletInfo.errorCount++;
      status.lastError = Date.now();
      
      // Якщо багато помилок, тимчасово відключаємо гаманець
      if (walletInfo.errorCount >= 3) {
        status.isAvailable = false;
        this.logger.warn(`⚠️ ${walletInfo.name} тимчасово відключено через помилки`);
        
        // Повертаємо через 5 хвилин
        setTimeout(() => {
          status.isAvailable = true;
          walletInfo.errorCount = 0;
          this.logger.info(`✅ ${walletInfo.name} знову доступний`);
        }, 5 * 60 * 1000);
      }
    }
    
    this.logger.debug(`🔓 ${walletInfo.name} позначено як вільний (успіх: ${success})`);
  }

  // Виконати транзакцію з автоматичним вибором гаманця або додати в чергу
  async executeTransaction(transactionFunction, ...args) {
    return new Promise((resolve, reject) => {
      const walletInfo = this.getAvailableWallet();
      
      if (walletInfo) {
        // Є доступний гаманець - виконуємо відразу
        this.executeTransactionWithWallet(walletInfo, {
          transactionFunction,
          args,
          resolve,
          reject,
          queuedAt: Date.now()
        }).then(resolve).catch(reject);
      } else {
        // Всі гаманці зайняті - додаємо в чергу
        this.logger.info('⏳ Всі гаманці зайняті, додаємо транзакцію в чергу');
        this.addToQueue(transactionFunction, args, resolve, reject);
      }
    });
  }

  // Отримати статистику гаманців
  getWalletStats() {
    return this.wallets.map(walletInfo => {
      const status = this.walletStatus.get(walletInfo.index);
      return {
        name: walletInfo.name,
        address: walletInfo.wallet.address,
        isAvailable: status.isAvailable,
        isProcessing: walletInfo.isProcessing,
        successCount: status.successCount,
        errorCount: status.errorCount,
        lastUsed: walletInfo.lastUsed
      };
    });
  }

  // Отримати основний гаманець для читання (не для транзакцій)
  getPrimaryWallet() {
    return this.wallets[0];
  }

  // Отримати детальну статистику використання
  getDetailedStats() {
    const totalSuccess = this.wallets.reduce((sum, w) => {
      const status = this.walletStatus.get(w.index);
      return sum + status.successCount;
    }, 0);

    const totalErrors = this.wallets.reduce((sum, w) => {
      const status = this.walletStatus.get(w.index);
      return sum + status.errorCount;
    }, 0);

    return {
      totalWallets: this.wallets.length,
      availableWallets: this.wallets.filter(w => {
        const status = this.walletStatus.get(w.index);
        return status.isAvailable && !w.isProcessing;
      }).length,
      processingWallets: this.wallets.filter(w => w.isProcessing).length,
      totalTransactions: totalSuccess + totalErrors,
      successfulTransactions: totalSuccess,
      failedTransactions: totalErrors,
      successRate: totalSuccess + totalErrors > 0 ? (totalSuccess / (totalSuccess + totalErrors) * 100).toFixed(2) + '%' : '0%',
      wallets: this.getWalletStats(),
      // Статистика черги
      queue: {
        currentSize: this.queueStats.currentQueueSize,
        totalQueued: this.queueStats.totalQueued,
        totalProcessed: this.queueStats.totalProcessed,
        maxWaitTime: this.queueStats.maxWaitTime,
        averageWaitTime: Math.round(this.queueStats.averageWaitTime),
        maxQueueSize: this.maxQueueSize,
        queueUtilization: ((this.queueStats.currentQueueSize / this.maxQueueSize) * 100).toFixed(1) + '%'
      }
    };
  }

  // Отримати статистику черги
  getQueueStats() {
    return {
      currentQueueSize: this.transactionQueue.length,
      maxQueueSize: this.maxQueueSize,
      totalQueued: this.queueStats.totalQueued,
      totalProcessed: this.queueStats.totalProcessed,
      pendingTransactions: this.transactionQueue.length,
      queueUtilization: ((this.transactionQueue.length / this.maxQueueSize) * 100).toFixed(1) + '%',
      averageWaitTime: Math.round(this.queueStats.averageWaitTime),
      maxWaitTime: this.queueStats.maxWaitTime,
      isProcessingQueue: this.isProcessingQueue
    };
  }

  // Очистити чергу (екстрений випадок)
  clearQueue() {
    const clearedCount = this.transactionQueue.length;
    this.transactionQueue.forEach(item => {
      item.reject(new Error('Черга була очищена адміністратором'));
    });
    this.transactionQueue = [];
    this.queueStats.currentQueueSize = 0;
    this.logger.warn(`🧹 Черга очищена, відхилено ${clearedCount} транзакцій`);
    return clearedCount;
  }

  // Логування статистики (викликається періодично)
  logStats() {
    const stats = this.getDetailedStats();
    this.logger.info(`📊 Статистика гаманців: ${stats.availableWallets}/${stats.totalWallets} доступно, ${stats.processingWallets} обробляють, успішність: ${stats.successRate}`);
    
    if (stats.queue.currentSize > 0 || stats.queue.totalQueued > 0) {
      this.logger.info(`📥 Статистика черги: ${stats.queue.currentSize} в черзі, ${stats.queue.totalProcessed}/${stats.queue.totalQueued} оброблено, середній час очікування: ${stats.queue.averageWaitTime}ms`);
    }
  }
}

export default WalletManager;