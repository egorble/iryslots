import { ethers } from 'ethers';
import contractABI from '../../artifacts/SlotMachineBank.abi.json';

// Конфігурація мережі IRYS
export const IRYS_CONFIG = {
  chainId: parseInt(import.meta.env.VITE_IRYS_CHAIN_ID || '1270'),
  chainName: 'IRYS Testnet',
  nativeCurrency: {
    name: 'IRYS',
    symbol: 'IRYS',
    decimals: 18,
  },
  rpcUrls: [import.meta.env.VITE_IRYS_RPC_URL || 'https://testnet-rpc.irys.xyz/v1/execution-rpc'],
  blockExplorerUrls: ['https://testnet-explorer.irys.xyz'],
};

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Типи для TypeScript
export interface WalletState {
  address: string | null;
  balance: string;
  gameBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface ContractError extends Error {
  code?: string;
  reason?: string;
}

// Клас для роботи з блокчейном
export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  // Підключення гаманця
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask не встановлено. Будь ласка, встановіть MetaMask для продовження.');
    }

    try {
      // Запитуємо дозвіл на підключення
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('Не вдалося отримати доступ до гаманця');
      }

      // Перевіряємо мережу
      await this.switchToIrysNetwork();

      // Ініціалізуємо провайдер та підписувача
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Ініціалізуємо контракт
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, this.signer);

      return accounts[0];
    } catch (error) {
      console.error('Помилка підключення гаманця:', error);
      throw error;
    }
  }

  // Перемикання на мережу IRYS
  async switchToIrysNetwork(): Promise<void> {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${IRYS_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Якщо мережа не додана, додаємо її
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${IRYS_CONFIG.chainId.toString(16)}`,
              chainName: IRYS_CONFIG.chainName,
              nativeCurrency: IRYS_CONFIG.nativeCurrency,
              rpcUrls: IRYS_CONFIG.rpcUrls,
              blockExplorerUrls: IRYS_CONFIG.blockExplorerUrls,
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Отримання балансу нативних токенів
  async getNativeBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Провайдер не ініціалізовано');
    
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Отримання ігрового балансу
  async getGameBalance(address: string): Promise<string> {
    if (!this.contract) throw new Error('Контракт не ініціалізовано');
    
    const balance = await this.contract.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Депозит коштів
  async deposit(amount: string): Promise<string> {
    if (!this.contract) throw new Error('Контракт не ініціалізовано');
    
    try {
      const value = ethers.parseEther(amount);
      const tx = await this.contract.deposit({ value });
      
      // Очікуємо підтвердження
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Помилка депозиту:', error);
      throw this.parseContractError(error);
    }
  }

  // Вивід коштів
  async withdraw(amount: string): Promise<string> {
    if (!this.contract) throw new Error('Контракт не ініціалізовано');
    
    try {
      const value = ethers.parseEther(amount);
      const tx = await this.contract.withdraw(value);
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Помилка виводу:', error);
      throw this.parseContractError(error);
    }
  }

  // Перевірка достатності коштів для ставки
  async hasSufficientBalance(address: string, betAmount: string): Promise<boolean> {
    if (!this.contract) throw new Error('Контракт не ініціалізовано');
    
    const value = ethers.parseEther(betAmount);
    return await this.contract.hasSufficientBalance(address, value);
  }

  // Отримання мінімального депозиту
  async getMinDeposit(): Promise<string> {
    if (!this.contract) throw new Error('Контракт не ініціалізовано');
    
    const minDeposit = await this.contract.minDeposit();
    return ethers.formatEther(minDeposit);
  }

  // Підписка на події контракту
  subscribeToEvents(callback: (event: any) => void) {
    if (!this.contract) return;

    // Підписуємося на події депозиту
    this.contract.on('Deposit', (player, amount, newBalance, event) => {
      callback({
        type: 'Deposit',
        player,
        amount: ethers.formatEther(amount),
        newBalance: ethers.formatEther(newBalance),
        txHash: event.log.transactionHash,
      });
    });

    // Підписуємося на події виводу
    this.contract.on('Withdrawal', (player, amount, newBalance, event) => {
      callback({
        type: 'Withdrawal',
        player,
        amount: ethers.formatEther(amount),
        newBalance: ethers.formatEther(newBalance),
        txHash: event.log.transactionHash,
      });
    });

    // Підписуємося на оновлення балансу
    this.contract.on('BalanceUpdated', (player, change, newBalance, reason, event) => {
      callback({
        type: 'BalanceUpdated',
        player,
        change: ethers.formatEther(change),
        newBalance: ethers.formatEther(newBalance),
        reason,
        txHash: event.log.transactionHash,
      });
    });
  }

  // Відписка від подій
  unsubscribeFromEvents() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Парсинг помилок контракту
  private parseContractError(error: any): ContractError {
    if (error.reason) {
      return new Error(error.reason) as ContractError;
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new Error('Недостатньо коштів для виконання операції') as ContractError;
    }
    
    if (error.message?.includes('BelowMinimumDeposit')) {
      return new Error('Сума депозиту менше мінімальної') as ContractError;
    }
    
    if (error.message?.includes('InsufficientBalance')) {
      return new Error('Недостатньо коштів на ігровому балансі') as ContractError;
    }
    
    if (error.message?.includes('AmountTooSmall')) {
      return new Error('Сума занадто мала') as ContractError;
    }
    
    return new Error('Помилка виконання операції') as ContractError;
  }

  // Перевірка підключення
  isConnected(): boolean {
    return !!this.signer && !!this.contract;
  }

  // Отримання адреси підключеного гаманця
  async getAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
}

// Глобальний інстанс сервісу
export const blockchainService = new BlockchainService();

// Утилітарні функції
export const formatIRYS = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(4);
};

export const parseIRYS = (amount: string): string => {
  return ethers.parseEther(amount).toString();
};

// Перевірка наявності MetaMask
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum;
};