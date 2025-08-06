import { ethers } from 'ethers';
import contractABI from '../../artifacts/SlotMachineBank.abi.json';

// IRYS Network Configuration
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

// TypeScript Types
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

// Blockchain Service Class
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

  // Connect wallet
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request connection permission
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('Failed to access wallet');
      }

      // Check network
      await this.switchToIrysNetwork();

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize contract
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, this.signer);

      return accounts[0];
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  // Switch to IRYS network
  async switchToIrysNetwork(): Promise<void> {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${IRYS_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If network is not added, add it
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

  // Get native token balance
  async getNativeBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Get game balance
  async getGameBalance(address: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const balance = await this.contract.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Deposit funds
  async deposit(amount: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const value = ethers.parseEther(amount);
      const tx = await this.contract.deposit({ value });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Deposit error:', error);
      throw this.parseContractError(error);
    }
  }

  // Withdraw funds
  async withdraw(amount: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const value = ethers.parseEther(amount);
      const tx = await this.contract.withdraw(value);
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Withdraw error:', error);
      throw this.parseContractError(error);
    }
  }

  // Check sufficient balance for bet
  async hasSufficientBalance(address: string, betAmount: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const value = ethers.parseEther(betAmount);
    return await this.contract.hasSufficientBalance(address, value);
  }

  // Get minimum deposit
  async getMinDeposit(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const minDeposit = await this.contract.minDeposit();
    return ethers.formatEther(minDeposit);
  }

  // Subscribe to contract events
  subscribeToEvents(callback: (event: any) => void) {
    if (!this.contract) return;

    // Subscribe to deposit events
    this.contract.on('Deposit', (player, amount, newBalance, event) => {
      callback({
        type: 'Deposit',
        player,
        amount: ethers.formatEther(amount),
        newBalance: ethers.formatEther(newBalance),
        txHash: event.log.transactionHash,
      });
    });

    // Subscribe to withdrawal events
    this.contract.on('Withdrawal', (player, amount, newBalance, event) => {
      callback({
        type: 'Withdrawal',
        player,
        amount: ethers.formatEther(amount),
        newBalance: ethers.formatEther(newBalance),
        txHash: event.log.transactionHash,
      });
    });

    // Subscribe to balance updates
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

  // Unsubscribe from events
  unsubscribeFromEvents() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Parse contract errors
  private parseContractError(error: any): ContractError {
    if (error.reason) {
      return new Error(error.reason) as ContractError;
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new Error('Insufficient funds to perform operation') as ContractError;
    }
    
    if (error.message?.includes('BelowMinimumDeposit')) {
      return new Error('Deposit amount is below minimum') as ContractError;
    }
    
    if (error.message?.includes('InsufficientBalance')) {
      return new Error('Insufficient funds in game balance') as ContractError;
    }
    
    if (error.message?.includes('AmountTooSmall')) {
      return new Error('Amount too small') as ContractError;
    }
    
    return new Error('Operation execution error') as ContractError;
  }

  // Check connection
  isConnected(): boolean {
    return !!this.signer && !!this.contract;
  }

  // Get connected wallet address
  async getAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
}

// Global service instance
export const blockchainService = new BlockchainService();

// Utility functions
export const formatIRYS = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(4);
};

export const parseIRYS = (amount: string): string => {
  return ethers.parseEther(amount).toString();
};

// Check MetaMask availability
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum;
};