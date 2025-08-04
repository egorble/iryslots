import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import Joi from 'joi';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cherry-charm-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
const serverWallet = new ethers.Wallet(process.env.SERVER_WALLET_KEY, provider);

// Load contract ABI
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/SlotMachineBank.abi.json'), 'utf8')
);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  serverWallet
);

// Express app setup
const app = express();
const PORT = process.env.PORT || 3001;

// Simple in-memory cache for balance requests
const balanceCache = new Map();
const CACHE_TTL = 10000; // 10 seconds cache

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs (збільшено)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Game-specific rate limiting
const gameRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 game results per minute per IP
  message: {
    success: false,
    error: 'Too many game requests, please slow down.'
  }
});

// Balance check rate limiting (more lenient)
const balanceRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 balance checks per minute per IP
  message: {
    success: false,
    error: 'Too many balance requests, please slow down.'
  }
});

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// Validation schemas
const gameResultSchema = Joi.object({
  playerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  betAmount: Joi.number().positive().max(1000).required(), // Max 1000 coins (10 IRYS)
  winAmount: Joi.number().min(0).max(10000).required(), // Max 10000 coins (100 IRYS)
  gameData: Joi.object({
    fruit0: Joi.string().valid('CHERRY', 'APPLE', 'BANANA', 'LEMON').required(),
    fruit1: Joi.string().valid('CHERRY', 'APPLE', 'BANANA', 'LEMON').required(),
    fruit2: Joi.string().valid('CHERRY', 'APPLE', 'BANANA', 'LEMON').required(),
    timestamp: Joi.number().integer().positive().required()
  }).required(),
  signature: Joi.string().optional() // For future client-side verification
});

const balanceCheckSchema = Joi.object({
  playerAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// Utility functions
const convertCoinsToWei = (coins) => {
  return ethers.parseEther((coins / 100).toString()); // 1 IRYS = 100 coins
};

const convertWeiToCoins = (wei) => {
  return Math.floor(parseFloat(ethers.formatEther(wei)) * 100);
};

const calculateWin = (fruit0, fruit1, fruit2) => {
  // Same logic as frontend calculateWin function
  let coins = 0;

  if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY' && fruit2 === 'CHERRY') {
    coins = 21;
  } else if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY') {
    coins = 16;
  } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE' && fruit2 === 'APPLE') {
    coins = 8;
  } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE') {
    coins = 4;
  } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA' && fruit2 === 'BANANA') {
    coins = 6;
  } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA') {
    coins = 2;
  } else if (fruit0 === 'LEMON' && fruit1 === 'LEMON' && fruit2 === 'LEMON') {
    coins = 3;
  }

  return coins;
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'cherry-charm-backend',
    blockchain: {
      network: process.env.IRYS_NETWORK,
      contract: process.env.CONTRACT_ADDRESS,
      serverWallet: serverWallet.address
    }
  });
});

// Get player balance
app.get('/api/balance/:address', balanceRateLimiter, async (req, res) => {
  try {
    const { error } = balanceCheckSchema.validate({ playerAddress: req.params.address });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const address = req.params.address.toLowerCase();
    const cacheKey = `balance_${address}`;
    const now = Date.now();

    // Check cache first
    const cached = balanceCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      logger.info(`Balance check for ${address}: ${cached.data.balance} coins (cached)`);
      return res.json({
        success: true,
        data: cached.data
      });
    }

    const balance = await contract.getBalance(req.params.address);
    const balanceInCoins = convertWeiToCoins(balance);

    const responseData = {
      address: req.params.address,
      balance: balanceInCoins,
      balanceWei: balance.toString(),
      balanceIRYS: ethers.formatEther(balance)
    };

    // Cache the result
    balanceCache.set(cacheKey, {
      data: responseData,
      timestamp: now
    });

    logger.info(`Balance check for ${address}: ${balanceInCoins} coins`);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    logger.error('Balance check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance'
    });
  }
});

// Submit game result
app.post('/api/game-result', gameRateLimiter, async (req, res) => {
  try {
    const { error, value } = gameResultSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { playerAddress, betAmount, winAmount, gameData } = value;
    const { fruit0, fruit1, fruit2, timestamp } = gameData;

    // Verify game timestamp (should be recent)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 60000) { // 1 minute tolerance
      return res.status(400).json({
        success: false,
        error: 'Game timestamp too old or in future'
      });
    }

    // Server-side win calculation verification
    const serverCalculatedWin = calculateWin(fruit0, fruit1, fruit2) * betAmount;
    
    if (Math.abs(serverCalculatedWin - winAmount) > 0.01) {
      logger.warn(`Win calculation mismatch for ${playerAddress}:`, {
        clientWin: winAmount,
        serverWin: serverCalculatedWin,
        fruits: [fruit0, fruit1, fruit2],
        bet: betAmount
      });
      
      return res.status(400).json({
        success: false,
        error: 'Win calculation mismatch'
      });
    }

    // Check if player has sufficient balance for bet
    const currentBalance = await contract.getBalance(playerAddress);
    const currentBalanceCoins = convertWeiToCoins(currentBalance);
    
    if (currentBalanceCoins < betAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance for bet'
      });
    }

    // Calculate net change (win - bet)
    const netChange = winAmount - betAmount;
    const netChangeWei = convertCoinsToWei(Math.abs(netChange));
    
    let txHash;
    let reason;

    if (netChange > 0) {
      // Player won
      reason = `win-${fruit0}-${fruit1}-${fruit2}`;
      const tx = await contract.updateBalance(playerAddress, netChangeWei, reason);
      txHash = tx.hash;
      await tx.wait();
      
      logger.info(`Player ${playerAddress} won ${netChange} coins`, {
        fruits: [fruit0, fruit1, fruit2],
        bet: betAmount,
        win: winAmount,
        txHash
      });
      
    } else if (netChange < 0) {
      // Player lost
      reason = `loss-${fruit0}-${fruit1}-${fruit2}`;
      const tx = await contract.updateBalance(playerAddress, -netChangeWei, reason);
      txHash = tx.hash;
      await tx.wait();
      
      logger.info(`Player ${playerAddress} lost ${Math.abs(netChange)} coins`, {
        fruits: [fruit0, fruit1, fruit2],
        bet: betAmount,
        win: winAmount,
        txHash
      });
      
    } else {
      // No change (bet = win, shouldn't happen in our game but handle it)
      reason = `draw-${fruit0}-${fruit1}-${fruit2}`;
      logger.info(`Player ${playerAddress} drew (no change)`, {
        fruits: [fruit0, fruit1, fruit2],
        bet: betAmount,
        win: winAmount
      });
    }

    // Clear cache for this player
    const cacheKey = `balance_${playerAddress.toLowerCase()}`;
    balanceCache.delete(cacheKey);

    // Get updated balance
    const newBalance = await contract.getBalance(playerAddress);
    const newBalanceCoins = convertWeiToCoins(newBalance);

    res.json({
      success: true,
      data: {
        playerAddress,
        netChange,
        newBalance: newBalanceCoins,
        newBalanceIRYS: ethers.formatEther(newBalance),
        txHash,
        reason,
        gameData: {
          fruits: [fruit0, fruit1, fruit2],
          bet: betAmount,
          win: winAmount,
          timestamp
        }
      }
    });

  } catch (error) {
    logger.error('Game result processing error:', error);
    
    // Check for specific contract errors
    if (error.message?.includes('InsufficientBalance')) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance for this operation'
      });
    }
    
    if (error.message?.includes('ContractPaused')) {
      return res.status(503).json({
        success: false,
        error: 'Game temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process game result'
    });
  }
});

// Get contract stats
app.get('/api/stats', async (req, res) => {
  try {
    const [totalDeposited, contractBalance] = await contract.getContractStats();
    const minDeposit = await contract.minDeposit();
    const isPaused = await contract.paused();

    res.json({
      success: true,
      data: {
        totalDeposited: ethers.formatEther(totalDeposited),
        contractBalance: ethers.formatEther(contractBalance),
        minDeposit: ethers.formatEther(minDeposit),
        isPaused,
        network: process.env.IRYS_NETWORK,
        contractAddress: process.env.CONTRACT_ADDRESS
      }
    });

  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract stats'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Cherry Charm server started on port ${PORT}`);
  logger.info(`📍 Contract: ${process.env.CONTRACT_ADDRESS}`);
  logger.info(`🔗 Network: ${process.env.IRYS_NETWORK}`);
  logger.info(`👛 Server wallet: ${serverWallet.address}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;