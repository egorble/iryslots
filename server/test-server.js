import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001';

// Test data
const TEST_PLAYER_ADDRESS = '0x233c8C54F25734B744E522bdC1Eed9cbc8C97D0c'; // From .env

async function testApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log(`✅ ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`❌ ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Cherry Charm Server API\\n');

  // Test 1: Health check
  console.log('1. Health Check');
  await testApi('/health');
  console.log('');

  // Test 2: Get contract stats
  console.log('2. Contract Stats');
  await testApi('/api/stats');
  console.log('');

  // Test 3: Get player balance
  console.log('3. Player Balance');
  await testApi(`/api/balance/${TEST_PLAYER_ADDRESS}`);
  console.log('');

  // Test 4: Submit game result (win)
  console.log('4. Game Result - Win (Cherry-Cherry-Cherry)');
  const winGameResult = {
    playerAddress: TEST_PLAYER_ADDRESS,
    betAmount: 1, // 1 coin
    winAmount: 21, // 21 coins (cherry-cherry-cherry)
    gameData: {
      fruit0: 'CHERRY',
      fruit1: 'CHERRY',
      fruit2: 'CHERRY',
      timestamp: Date.now()
    }
  };

  await testApi('/api/game-result', {
    method: 'POST',
    body: JSON.stringify(winGameResult),
  });
  console.log('');

  // Wait a bit for transaction to process
  console.log('⏳ Waiting for transaction to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 5: Submit game result (loss)
  console.log('5. Game Result - Loss (No match)');
  const lossGameResult = {
    playerAddress: TEST_PLAYER_ADDRESS,
    betAmount: 5, // 5 coins
    winAmount: 0, // 0 coins (no match)
    gameData: {
      fruit0: 'CHERRY',
      fruit1: 'APPLE',
      fruit2: 'BANANA',
      timestamp: Date.now()
    }
  };

  await testApi('/api/game-result', {
    method: 'POST',
    body: JSON.stringify(lossGameResult),
  });
  console.log('');

  // Wait a bit for transaction to process
  console.log('⏳ Waiting for transaction to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 6: Check balance after games
  console.log('6. Final Balance Check');
  await testApi(`/api/balance/${TEST_PLAYER_ADDRESS}`);
  console.log('');

  // Test 7: Invalid requests
  console.log('7. Invalid Requests Tests');
  
  // Invalid address
  console.log('7a. Invalid address format:');
  await testApi('/api/balance/invalid-address');
  
  // Invalid game result
  console.log('7b. Invalid game result:');
  const invalidGameResult = {
    playerAddress: 'invalid-address',
    betAmount: -1, // Invalid negative bet
    winAmount: 'not-a-number', // Invalid win amount
    gameData: {
      fruit0: 'INVALID_FRUIT',
      fruit1: 'APPLE',
      fruit2: 'BANANA',
      timestamp: Date.now()
    }
  };

  await testApi('/api/game-result', {
    method: 'POST',
    body: JSON.stringify(invalidGameResult),
  });

  console.log('\\n🎉 Server testing completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };