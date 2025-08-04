// API client for Cherry Charm backend

const API_BASE_URL = import.meta.env.VITE_SERVER_ENDPOINT || 'http://localhost:3001';

export interface GameResult {
  playerAddress: string;
  betAmount: number;
  winAmount: number;
  gameData: {
    fruit0: string;
    fruit1: string;
    fruit2: string;
    timestamp: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BalanceResponse {
  address: string;
  balance: number;
  balanceWei: string;
  balanceIRYS: string;
}

export interface GameResultResponse {
  playerAddress: string;
  netChange: number;
  newBalance: number;
  newBalanceIRYS: string;
  txHash?: string;
  reason: string;
  gameData: {
    fruits: string[];
    bet: number;
    win: number;
    timestamp: number;
  };
}

export interface ContractStats {
  totalDeposited: string;
  contractBalance: string;
  minDeposit: string;
  isPaused: boolean;
  network: string;
  contractAddress: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Handle rate limiting and other non-JSON responses
      if (response.status === 429) {
        return {
          success: false,
          error: 'Too many requests. Please wait a moment and try again.',
        };
      }

      // Try to parse JSON, but handle cases where response is not JSON
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, treat as text
          const text = await response.text();
          data = { error: text };
        }
      } else {
        // Non-JSON response (like rate limit text)
        const text = await response.text();
        data = { error: text };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Handle specific error types
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and server status.',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Get player balance
  async getBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
    return this.request<BalanceResponse>(`/api/balance/${address}`);
  }

  // Submit game result
  async submitGameResult(gameResult: GameResult): Promise<ApiResponse<GameResultResponse>> {
    return this.request<GameResultResponse>('/api/game-result', {
      method: 'POST',
      body: JSON.stringify(gameResult),
    });
  }

  // Get contract statistics
  async getContractStats(): Promise<ApiResponse<ContractStats>> {
    return this.request<ContractStats>('/api/stats');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Utility functions
export const convertCoinsToIRYS = (coins: number): number => {
  return coins / 100; // 1 IRYS = 100 coins
};

export const convertIRYSToCoins = (irys: number): number => {
  return Math.floor(irys * 100);
};

// Error handling utilities
export const isApiError = (response: ApiResponse): response is ApiResponse & { error: string } => {
  return !response.success && !!response.error;
};

export const getErrorMessage = (response: ApiResponse): string => {
  if (isApiError(response)) {
    return response.error;
  }
  return 'Unknown error occurred';
};