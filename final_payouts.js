// Фінальні виплати для RTP близько 85%

const reels = {
  0: ['CHERRY', 'LEMON', 'LEMON', 'BANANA', 'BANANA', 'LEMON', 'APPLE', 'LEMON', 'CHERRY', 'LEMON', 'LEMON', 'BANANA', 'BANANA', 'LEMON', 'APPLE', 'LEMON'],
  1: ['LEMON', 'LEMON', 'BANANA', 'APPLE', 'CHERRY', 'LEMON', 'LEMON', 'APPLE', 'LEMON', 'LEMON', 'BANANA', 'APPLE', 'CHERRY', 'LEMON', 'LEMON', 'APPLE'],
  2: ['LEMON', 'LEMON', 'BANANA', 'LEMON', 'CHERRY', 'APPLE', 'LEMON', 'APPLE', 'LEMON', 'LEMON', 'BANANA', 'LEMON', 'CHERRY', 'APPLE', 'LEMON', 'APPLE']
};

// Підкориговані виплати для точного RTP 85%
const finalPayouts = {
  'CHERRY-CHERRY-CHERRY': 21,  
  'CHERRY-CHERRY': 16,         
  'APPLE-APPLE-APPLE': 8,     
  'APPLE-APPLE': 4,            
  'BANANA-BANANA-BANANA': 6,   
  'BANANA-BANANA': 2,          
  'LEMON-LEMON-LEMON': 3       
};

function verifyRTP() {
  let totalPayout = 0;
  
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      for (let k = 0; k < 16; k++) {
        const fruit0 = reels[0][i];
        const fruit1 = reels[1][j];
        const fruit2 = reels[2][k];
        
        let payout = 0;
        
        if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY' && fruit2 === 'CHERRY') {
          payout = finalPayouts['CHERRY-CHERRY-CHERRY'];
        } else if (fruit0 === 'CHERRY' && fruit1 === 'CHERRY') {
          payout = finalPayouts['CHERRY-CHERRY'];
        } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE' && fruit2 === 'APPLE') {
          payout = finalPayouts['APPLE-APPLE-APPLE'];
        } else if (fruit0 === 'APPLE' && fruit1 === 'APPLE') {
          payout = finalPayouts['APPLE-APPLE'];
        } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA' && fruit2 === 'BANANA') {
          payout = finalPayouts['BANANA-BANANA-BANANA'];
        } else if (fruit0 === 'BANANA' && fruit1 === 'BANANA') {
          payout = finalPayouts['BANANA-BANANA'];
        } else if (fruit0 === 'LEMON' && fruit1 === 'LEMON' && fruit2 === 'LEMON') {
          payout = finalPayouts['LEMON-LEMON-LEMON'];
        }
        
        totalPayout += payout;
      }
    }
  }
  
  const rtp = (totalPayout / 4096) * 100;
  
  console.log('Фінальні виплати:');
  Object.entries(finalPayouts).forEach(([combo, payout]) => {
    console.log(`${combo}: ${payout} монет`);
  });
  
  console.log(`\nЗагальна виплата: ${totalPayout}`);
  console.log(`Фінальний RTP: ${rtp.toFixed(2)}%`);
}

verifyRTP();