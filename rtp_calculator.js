// Розрахунок поточного RTP для Cherry Charm

// Поточні барабани (з segmentToFruit.ts)
const reels = {
  0: ['CHERRY', 'LEMON', 'LEMON', 'BANANA', 'BANANA', 'LEMON', 'APPLE', 'LEMON', 'CHERRY', 'LEMON', 'LEMON', 'BANANA', 'BANANA', 'LEMON', 'APPLE', 'LEMON'],
  1: ['LEMON', 'LEMON', 'BANANA', 'APPLE', 'CHERRY', 'LEMON', 'LEMON', 'APPLE', 'LEMON', 'LEMON', 'BANANA', 'APPLE', 'CHERRY', 'LEMON', 'LEMON', 'APPLE'],
  2: ['LEMON', 'LEMON', 'BANANA', 'LEMON', 'CHERRY', 'APPLE', 'LEMON', 'APPLE', 'LEMON', 'LEMON', 'BANANA', 'LEMON', 'CHERRY', 'APPLE', 'LEMON', 'APPLE']
};

// Поточні виплати
const payouts = {
  'CHERRY-CHERRY-CHERRY': 50,
  'CHERRY-CHERRY': 40,
  'APPLE-APPLE-APPLE': 20,
  'APPLE-APPLE': 10,
  'BANANA-BANANA-BANANA': 15,
  'BANANA-BANANA': 5,
  'LEMON-LEMON-LEMON': 5
};

// Підрахунок ймовірностей
function calculateRTP() {
  let totalPayout = 0;
  let totalCombinations = 0;
  
  // Перебираємо всі можливі комбінації
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      for (let k = 0; k < 16; k++) {
        totalCombinations++;
        
        const fruit0 = reels[0][i];
        const fruit1 = reels[1][j];
        const fruit2 = reels[2][k];
        
        let payout = 0;
        
        // Перевіряємо виграшні комбінації
        if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY' && fruit2 === 'CHERRY') {
          payout = 50;
        } else if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY') {
          payout = 40;
        } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE' && fruit2 === 'APPLE') {
          payout = 20;
        } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE') {
          payout = 10;
        } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA' && fruit2 === 'BANANA') {
          payout = 15;
        } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA') {
          payout = 5;
        } else if (fruit0 === 'LEMON' && fruit1 === 'LEMON' && fruit2 === 'LEMON') {
          payout = 5;
        }
        
        totalPayout += payout;
      }
    }
  }
  
  const rtp = (totalPayout / totalCombinations) * 100;
  
  console.log(`Загальна кількість комбінацій: ${totalCombinations}`);
  console.log(`Загальна виплата: ${totalPayout}`);
  console.log(`Середня виплата за спін: ${totalPayout / totalCombinations}`);
  console.log(`Поточний RTP: ${rtp.toFixed(2)}%`);
  
  return rtp;
}

calculateRTP();