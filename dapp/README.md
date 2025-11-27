# CPC DApp Frontend

Main decentralized application for interacting with CPC smart contracts.

## 🌟 Features

- 🔐 **Wallet Connection**: MetaMask, Binance Wallet, WalletConnect
- 💰 **Airdrop**: Claim 1 CPC with BABT NFT
- 🎨 **NFT Presale**: Purchase NFTs and earn CPC rewards
- ⛏️ **Mining**: Stake CPC tokens for rewards
- 📊 **Dashboard**: View balances and statistics

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.x
- MetaMask or compatible Web3 wallet
- BNB for gas fees

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Open http://localhost:3000 in your browser.

### Production Build

```bash
npm run build
```

## 📁 File Structure

```
dapp/
├── index.html              # Main HTML file
├── script.js               # Application logic
├── styles.css              # Styling
├── wallet-connector.js     # Wallet integration
├── contracts-abi.js        # Contract ABIs
├── package.json            # Dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Contract Addresses

Update contract addresses in `script.js`:

```javascript
const CONTRACTS = {
    CPCTOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9',
    AIRDROP: '0x9929858f17FD3B3e2D012AB6bB729603D1B88B07',
    PRESALE: '0xd6906C076e902E44C7adc8FcC190d4b1f687Ac1d',
    MINING: '0x0fd5dFf70E3c8a672FDF6b2126114389B4Ea7743',
    REWARDNFT: '0x4313EfBcc53Fe8DEAe8e55Af55AA9c6cBC57f359',
    BABT: '0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8'
};
```

### Network Configuration

The DApp automatically connects to BSC Mainnet (Chain ID: 56).

## 🎮 Usage

### 1. Connect Wallet

Click "Connect Wallet" and select your wallet provider.

### 2. Claim Airdrop

- Requires BABT NFT
- Click "Claim Airdrop" button
- Confirm transaction in wallet
- Receive 1 CPC

### 3. Purchase NFT

- Select amount (1, 10, 100, or 1000 BNB)
- Click purchase button
- Confirm transaction
- Receive NFT and CPC rewards

### 4. Mining

- Activate staking (2 USDT fee)
- Approve CPC tokens
- Stake desired amount
- Claim rewards anytime

## 🔒 Security

- ✅ No private keys stored
- ✅ All transactions user-approved
- ✅ Direct blockchain interaction
- ✅ Open source and auditable

## 🌐 Browser Support

- Chrome/Brave (recommended)
- Firefox
- Edge
- Safari (with MetaMask extension)

## 📱 Mobile Support

- MetaMask Mobile
- Trust Wallet
- Binance Chain Wallet

## 🐛 Troubleshooting

### Wallet Not Connecting

1. Ensure MetaMask is installed
2. Refresh the page
3. Check if wallet is unlocked
4. Try different browser

### Wrong Network

1. DApp will prompt to switch to BSC
2. Approve network switch in wallet
3. If fails, manually add BSC network

### Transaction Failing

1. Check BNB balance for gas
2. Check CPC balance (for staking)
3. Ensure sufficient allowance
4. Try increasing gas limit

## 📞 Support

For issues, please open a GitHub issue or contact support.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.
