import { useState, useEffect, useCallback } from 'react';
import { blockchainService, WalletState, formatIRYS, isMetaMaskInstalled } from '../utils/blockchain';
import { apiClient } from '../utils/api';
import devLog from '../utils/functions/devLog';
import useGame from '../stores/store';

export const useBlockchain = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: '0',
    gameBalance: '0',
    isConnected: false,
    isConnecting: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [minDeposit, setMinDeposit] = useState<string>('0.01');

  // Підключення гаманця
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask не встановлено. Будь ласка, встановіть MetaMask для продовження.');
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true }));
    setError(null);

    try {
      const address = await blockchainService.connectWallet();
      devLog(`Гаманець підключено: ${address}`);

      // Отримуємо баланси
      const [nativeBalance, gameBalance, minDep] = await Promise.all([
        blockchainService.getNativeBalance(address),
        blockchainService.getGameBalance(address),
        blockchainService.getMinDeposit(),
      ]);

      setWalletState({
        address,
        balance: nativeBalance,
        gameBalance,
        isConnected: true,
        isConnecting: false,
      });

      setMinDeposit(minDep);

      // Синхронізуємо з store
      const { syncWithBlockchain } = useGame.getState();
      await syncWithBlockchain();

      // Підписуємося на події контракту
      blockchainService.subscribeToEvents((event) => {
        devLog(`Подія контракту: ${event.type}`);

        // Оновлюємо баланси при подіях
        if (event.player.toLowerCase() === address.toLowerCase()) {
          updateBalances();
          // Також синхронізуємо з store
          syncWithBlockchain();
        }
      });

    } catch (err: any) {
      devLog(`Помилка підключення гаманця: ${err.message}`);
      setError(err.message);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  }, []);

  // Відключення гаманця
  const disconnectWallet = useCallback(() => {
    blockchainService.unsubscribeFromEvents();
    setWalletState({
      address: null,
      balance: '0',
      gameBalance: '0',
      isConnected: false,
      isConnecting: false,
    });
    setError(null);
    devLog('Гаманець відключено');
  }, []);

  // Оновлення балансів
  const updateBalances = useCallback(async () => {
    if (!walletState.address || !blockchainService.isConnected()) return;

    try {
      // Get native balance
      const nativeBalance = await blockchainService.getNativeBalance(walletState.address);

      // Try to get server balance with retry logic
      let gameBalance = '0';
      let serverBalanceResponse = await apiClient.getBalance(walletState.address);

      // If rate limited, wait and retry once
      if (!serverBalanceResponse.success &&
        serverBalanceResponse.error?.includes('Too many requests')) {
        devLog('Rate limited, waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        serverBalanceResponse = await apiClient.getBalance(walletState.address);
      }

      if (serverBalanceResponse.success && serverBalanceResponse.data) {
        // Use server balance (more reliable)
        gameBalance = serverBalanceResponse.data.balanceIRYS;
        devLog(`Server balance: ${gameBalance} IRYS`);
      } else {
        // Fallback to direct blockchain query
        devLog(`Server balance failed: ${serverBalanceResponse.error}, using blockchain fallback`);
        gameBalance = await blockchainService.getGameBalance(walletState.address);
        devLog(`Blockchain balance: ${gameBalance} IRYS`);
      }

      setWalletState(prev => ({
        ...prev,
        balance: nativeBalance,
        gameBalance,
      }));
    } catch (err: any) {
      devLog(`Помилка оновлення балансів: ${err.message}`);
    }
  }, [walletState.address]);

  // Депозит коштів
  const deposit = useCallback(async (amount: string): Promise<boolean> => {
    if (!walletState.isConnected) {
      setError('Гаманець не підключено');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const txHash = await blockchainService.deposit(amount);
      devLog(`Депозит успішний: ${txHash}`);

      // Оновлюємо баланси після депозиту
      setTimeout(updateBalances, 2000);

      return true;
    } catch (err: any) {
      devLog(`Помилка депозиту: ${err.message}`);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletState.isConnected, updateBalances]);

  // Вивід коштів
  const withdraw = useCallback(async (amount: string): Promise<boolean> => {
    if (!walletState.isConnected) {
      setError('Гаманець не підключено');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const txHash = await blockchainService.withdraw(amount);
      devLog(`Вивід успішний: ${txHash}`);

      // Оновлюємо баланси після виводу
      setTimeout(updateBalances, 2000);

      return true;
    } catch (err: any) {
      devLog(`Помилка виводу: ${err.message}`);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletState.isConnected, updateBalances]);

  // Перевірка достатності коштів для ставки
  const hasSufficientBalance = useCallback(async (betAmount: string): Promise<boolean> => {
    if (!walletState.address) return false;

    try {
      return await blockchainService.hasSufficientBalance(walletState.address, betAmount);
    } catch (err: any) {
      devLog(`Помилка перевірки балансу: ${err.message}`);
      return false;
    }
  }, [walletState.address]);

  // Очищення помилки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Перевірка підключення при завантаженні
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          // Автоматично підключаємося, якщо гаманець вже авторизований
          await connectWallet();
        }
      } catch (err) {
        devLog('Помилка перевірки підключення:', err);
      }
    };

    checkConnection();
  }, [connectWallet]);

  // Слухаємо зміни акаунтів
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== walletState.address) {
        // Перепідключаємося з новим акаунтом
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Перезавантажуємо сторінку при зміні мережі
      window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletState.address, connectWallet, disconnectWallet]);

  // Періодичне оновлення балансів
  useEffect(() => {
    if (!walletState.isConnected) return;

    const interval = setInterval(updateBalances, 60000); // Кожні 60 секунд (зменшено навантаження)
    return () => clearInterval(interval);
  }, [walletState.isConnected, updateBalances]);

  return {
    // Стан
    walletState,
    error,
    isLoading,
    minDeposit,

    // Дії
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    updateBalances,
    hasSufficientBalance,
    clearError,

    // Утиліти
    formatIRYS,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
};