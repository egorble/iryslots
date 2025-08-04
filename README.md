# 🎰 Cherry Charm - Blockchain Slot Machine

A modern, blockchain-integrated slot machine game built with React Three Fiber and IRYS tokens.

![Cherry Charm](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Blockchain](https://img.shields.io/badge/Blockchain-IRYS-50ffd6)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-Latest-black)

## ✨ Features

- **🎮 3D Slot Machine**: Immersive 3D graphics with React Three Fiber
- **🔗 Blockchain Integration**: Real IRYS token gameplay
- **💰 Smart Contracts**: Secure fund management with Solidity
- **🎨 Modern UI**: Awwwards-level design with neon aesthetics
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **⚡ Real-time**: Live balance updates and transaction processing
- **🔒 Secure**: Server-side game validation and rate limiting

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Three Fiber** for 3D graphics
- **Zustand** for state management
- **Ethers.js** for blockchain interaction
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **Smart Contracts** in Solidity
- **Hardhat** for development
- **Winston** for logging
- **Rate limiting** and security middleware

### Blockchain
- **IRYS Network** (Testnet)
- **MetaMask** wallet integration
- **Native token** transactions
- **Smart contract** fund management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- IRYS testnet tokens

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cherry-charm.git
   cd cherry-charm
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Deploy smart contract**
   ```bash
   npm run deploy
   ```

5. **Start the application**
   ```bash
   npm run start:all
   ```

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect MetaMask" to link your wallet
2. **Deposit Funds**: Add IRYS tokens to your game balance
3. **Set Bet**: Use ⏶/⏷ buttons to adjust your bet amount
4. **Spin**: Click the SPIN button or press spacebar
5. **Win**: Match symbols to win coins based on the paytable
6. **Withdraw**: Cash out your winnings anytime

## 🏆 Paytable

| Combination | Multiplier |
|-------------|------------|
| 🍒🍒🍒 | 21x |
| 🍒🍒 | 16x |
| 🍎🍎🍎 | 8x |
| 🍎🍎 | 4x |
| 🍌🍌🍌 | 6x |
| 🍌🍌 | 2x |
| 🍋🍋🍋 | 3x |

## 🔧 Development

### Available Scripts

```bash
# Frontend development
npm run dev

# Backend development
npm run server:dev

# Start everything
npm run start:all

# Build for production
npm run build

# Deploy smart contract
npm run deploy

# Run tests
npm run test
```

### Project Structure

```
cherry-charm/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   ├── stores/            # Zustand stores
│   ├── utils/             # Utility functions
│   └── interface/         # UI components
├── server/                # Backend Express server
│   ├── server.js          # Main server file
│   └── test-server.js     # Test utilities
├── contracts/             # Smart contracts
│   └── SlotMachineBank.sol
├── artifacts/             # Compiled contracts
└── public/               # Static assets
```

## 🔐 Smart Contract

The `SlotMachineBank` contract manages:
- Player deposits and withdrawals
- Game balance tracking
- Server-controlled balance updates
- Emergency functions for admin

### Key Functions
- `deposit()` - Add funds to game balance
- `withdraw(amount)` - Remove funds from game balance
- `updateBalance()` - Server updates after game results
- `getBalance()` - Check current balance

## 🌐 Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables

### Backend (Railway/Heroku)
1. Deploy the `server` folder
2. Set environment variables
3. Ensure smart contract is deployed

### Smart Contract
1. Configure network in `hardhat.config.js`
2. Run `npm run deploy`
3. Update contract address in `.env`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original slot machine concept by Michael Kolesidis
- IRYS Network for blockchain infrastructure
- React Three Fiber community
- All contributors and testers

## 📞 Support

- 📧 Email: support@cherrycharm.game
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/cherry-charm/issues)
- 💬 Discord: [Join our community](https://discord.gg/cherrycharm)

---

**⚠️ Disclaimer**: This is a game of chance. Please gamble responsibly and only with funds you can afford to lose.