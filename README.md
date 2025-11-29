# 🌟 Common Prosperity Coin (CPC)

A decentralized Web3 ecosystem on Binance Smart Chain featuring token distribution, NFT rewards, OTC trading, and community governance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-blue)](https://soliditylang.org/)
[![BSC](https://img.shields.io/badge/BSC-Mainnet-green)](https://bscscan.com/)

## 📋 Overview

CPC is a comprehensive DeFi ecosystem that includes:

- **Token Distribution**: Airdrop system with BABT NFT verification
- **NFT Presale**: Purchase NFTs with BNB and earn CPC rewards
- **Mining System**: Stake CPC tokens to earn rewards
- **OTC Trading**: Peer-to-peer CPC trading platform with monthly X (Twitter) giveaways

## 🚀 Features

### Smart Contracts
- ✅ **CPCToken**: ERC20 token with 13.37M total supply
- ✅ **Airdrop**: BABT-gated airdrop (1 CPC per claim)
- ✅ **Presale**: NFT presale with CPC rewards
- ✅ **Mining**: Stake CPC to earn rewards
- ✅ **RewardNFT**: ERC721 NFT with daily rewards
- ✅ **CPCOTC**: P2P trading with 0.2% fees and monthly giveaways

### Frontend DApps
- 🌐 Main DApp with wallet integration
- 💱 OTC Trading Interface

## 📦 Project Structure

```
CPC-OpenSource/
├── contracts/          # Smart contracts
│   ├── src/           # Solidity source files
│   ├── test/          # Contract tests
│   └── scripts/       # Deployment scripts
├── dapp/              # Main DApp frontend
├── otc/               # OTC trading UI
├── docs/              # Documentation
└── README.md
```

## 🔗 Deployed Contracts (BSC Mainnet)

| Contract | Address | Verified |
|----------|---------|----------|
| CPC Token | `0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9` | ✅ |
| Airdrop | `0x9929858f17FD3B3e2D012AB6bB729603D1B88B07` | ✅ |
| Presale | `0xd6906C076e902E44C7adc8FcC190d4b1f687Ac1d` | ✅ |
| Mining | `0x0fd5dFf70E3c8a672FDF6b2126114389B4Ea7743` | ✅ |
| RewardNFT | `0x4313EfBcc53Fe8DEAe8e55Af55AA9c6cBC57f359` | ✅ |
| OTC | `0x9886e955DaD9ABcCC86980E1aC55cA2Ae57D5082` | ✅ |

## 🛠️ Technology Stack

- **Blockchain**: Binance Smart Chain (BSC)
- **Smart Contracts**: Solidity ^0.8.24
- **Development**: Hardhat
- **Frontend**: Vanilla JavaScript, Web3.js
- **Standards**: ERC20, ERC721, OpenZeppelin

## 📚 Documentation

- [Smart Contracts](./contracts/README.md) - Contract documentation
- [DApp Guide](./dapp/README.md) - Frontend setup and usage
- [OTC Trading](./otc/README.md) - OTC platform guide
- [Deployment Guide](./docs/DEPLOYMENT.md) - How to deploy
- [User Guide](./docs/USER_GUIDE.md) - How to use the platform

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.x
- MetaMask or compatible Web3 wallet
- BNB for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CPC-OpenSource.git
cd CPC-OpenSource

# Install contract dependencies
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Running the DApp

```bash
# Navigate to dapp folder
cd dapp

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

## 🧪 Testing

```bash
cd contracts

# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/CPCToken.test.js

# Run with coverage
npx hardhat coverage
```

## 📖 How It Works

### 1. Token Distribution
- Users with BABT NFT can claim 1 CPC airdrop
- Purchase NFTs with BNB to earn CPC rewards
- Stake CPC in mining contract for additional rewards

### 2. OTC Trading
- Create buy/sell orders for CPC tokens
- 0.001 BNB order creation fee (paid by buyer)
- 0.2% trading fee on filled orders (deducted from seller)
- All fees go to monthly X (Twitter) giveaway winners
- Follow @icpc_cc on X to participate in monthly giveaways

## 🔒 Security

- ✅ All contracts audited and tested
- ✅ No admin keys or upgrade functions
- ✅ Immutable after deployment
- ✅ ReentrancyGuard on all state-changing functions
- ✅ OpenZeppelin battle-tested libraries

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [Coming Soon]
- **Twitter**: [Coming Soon]
- **Telegram**: [Coming Soon]
- **Discord**: [Coming Soon]

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. The developers are not responsible for any losses incurred through the use of this software.

## 📞 Support

For questions and support, please open an issue on GitHub.

---

**Built with ❤️ for the BSC community**
