// Розрахунок нових виплат для RTP 85%

const reels = {
  0: ['CHERRY', 'LEMON', 'LEMON', 'BANANA', 'BANANA', 'LEMON', 'APPLE', 'LEMON', 'CHERRY', 'LEMON', 'LEMON', 'BANANA', 'BANANA', 'LEMON', 'APPLE', 'LEMON'],
  1: ['LEMON', 'LEMON', 'BANANA', 'APPLE', 'CHERRY', 'LEMON', 'LEMON', 'APPLE', 'LEMON', 'LEMON', 'BANANA', 'APPLE', 'CHERRY', 'LEMON', 'LEMON', 'APPLE'],
  2: ['LEMON', 'LEMON', 'BANANA', 'LEMON', 'CHERRY', 'APPLE', 'LEMON', 'APPLE', 'LEMON', 'LEMON', 'BANANA', 'LEMON', 'CHERRY', 'APPLE', 'LEMON', 'APPLE']
};

// Підрахунок частоти кожної комбінації
function calculateFrequencies() {
  const combinations = {};
  
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      for (let k = 0; k < 16; k++) {
        const fruit0 = reels[0][i];
        const fruit1 = reels[1][j];
        const fruit2 = reels[2][k];
        
        let combo = '';
        if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY' && fruit2 === 'CHERRY') {
          combo = 'CHERRY-CHERRY-CHERRY';
        } else if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY') {
          combo = 'CHERRY-CHERRY';
        } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE' && fruit2 === 'APPLE') {
          combo = 'APPLE-APPLE-APPLE';
        } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE') {
          combo = 'APPLE-APPLE';
        } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA' && fruit2 === 'BANANA') {
          combo = 'BANANA-BANANA-BANANA';
        } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA') {
          combo = 'BANANA-BANANA';
        } else if (fruit0 === 'LEMON' && fruit1 === 'LEMON' && fruit2 === 'LEMON') {
          combo = 'LEMON-LEMON-LEMON';
        }
        
        if (combo) {
          combinations[combo] = (combinations[combo] || 0) + 1;
        }
      }
    }
  }
  
  console.log('Частота виграшних комбінацій:');
  Object.entries(combinations).forEach(([combo, freq]) => {
    console.log(`${combo}: ${freq} разів (${(freq/4096*100).toFixed(2)}%)`);
  });
  
  return combinations;
}

// Розрахунок нових виплат для RTP 85%
function calculateNewPayouts() {
  const frequencies = calculateFrequencies();
  const targetRTP = 0.85; // 85%
  const totalCombinations = 4096;
  const targetTotalPayout = targetRTP * totalCombinations;
  
  console.log(`\nЦільова загальна виплата для RTP 85%: ${targetTotalPayout}`);
  
  // Поточний коефіцієнт зменшення
  const currentTotalPayout = 7600;
  const reductionFactor = targetTotalPayout / currentTotalPayout;
  
  console.log(`Коефіцієнт зменшення: ${reductionFactor.toFixed(4)}`);
  
  // Нові виплати (округлені)
  const newPayouts = {
    'CHERRY-CHERRY-CHERRY': Math.round(50 * reductionFactor),
    'CHERRY-CHERRY': Math.round(40 * reductionFactor),
    'APPLE-APPLE-APPLE': Math.round(20 * reductionFactor),
    'APPLE-APPLE': Math.round(10 * reductionFactor),
    'BANANA-BANANA-BANANA': Math.round(15 * reductionFactor),
    'BANANA-BANANA': Math.round(5 * reductionFactor),
    'LEMON-LEMON-LEMON': Math.round(5 * reductionFactor)
  };
  
  console.log('\nНові виплати:');
  Object.entries(newPayouts).forEach(([combo, payout]) => {
    console.log(`${combo}: ${payout} монет`);
  });
  
  // Перевірка нового RTP
  let newTotalPayout = 0;
  Object.entries(frequencies).forEach(([combo, freq]) => {
    newTotalPayout += newPayouts[combo] * freq;
  });
  
  const actualRTP = (newTotalPayout / totalCombinations) * 100;
  console.log(`\nФактичний RTP з новими виплатами: ${actualRTP.toFixed(2)}%`);
  
  return newPayouts;
}

calculateNewPayouts();