# CPC Smart Contracts

Solidity smart contracts for the Common Prosperity Coin ecosystem on Binance Smart Chain.

## 📋 Contracts Overview

### Core Contracts

| Contract | Description | Status |
|----------|-------------|--------|
| **CPCToken.sol** | ERC20 token (13.37M supply) | ✅ Deployed |
| **Airdrop.sol** | BABT-gated airdrop system | ✅ Deployed |
| **Presale.sol** | NFT presale with CPC rewards | ✅ Deployed |
| **Mining.sol** | CPC staking and rewards | ✅ Deployed |
| **RewardNFT.sol** | ERC721 NFT with daily rewards | ✅ Deployed |
| **CPCOTC.sol** | P2P trading with monthly giveaways | ✅ Deployed |

### Supporting Contracts

| Contract | Description |
|----------|-------------|
| **MockERC20.sol** | Test token for development |

## 🛠️ Development

### Prerequisites

```bash
node >= 16.x
npm >= 8.x
```

### Installation

```bash
npm install
```

### Compilation

```bash
npx hardhat compile
```

### Testing

```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/test-comprehensive.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

## 📦 Deployment

### Local Network

```bash
# Start local node
npx hardhat node

# Deploy (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### BSC Testnet

```bash
# Configure .env file
cp .env.example .env
# Add your PRIVATE_KEY and BSCSCAN_API_KEY

# Deploy
npx hardhat run scripts/deploy.js --network bscTestnet
```

### BSC Mainnet

```bash
npx hardhat run scripts/deploy.js --network bsc
```

## 🔍 Verification

### Automatic Verification

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Manual Verification

Use the flattened contracts in `flattened/` directory for manual verification on BSCScan.

## 📊 Contract Details

### CPCToken
- **Type**: ERC20
- **Supply**: 13,370,000 CPC
- **Decimals**: 18
- **Features**: Ownable (ownership renounced)

### Airdrop
- **Claim Amount**: 1 CPC
- **Requirement**: BABT NFT ownership
- **One-time**: Each address can claim once

### Presale
- **NFT Price**: Variable BNB amounts
- **CPC Rewards**: Based on purchase amount
- **NFT Supply**: Limited

### Mining
- **Stake**: CPC tokens
- **Rewards**: CPC + NFT daily rewards
- **Activation**: 2 USDT fee

### CPCOTC
- **Creation Fee**: 0.001 BNB (paid by buyer)
- **Trading Fee**: 0.2% (deducted from seller)
- **Fee Destination**: Monthly X (Twitter) giveaway winners
- **Features**: Buy/sell orders, partial fills
- **Giveaway**: Follow @icpc_cc on X to participate

## 🔒 Security

### Audits
- ✅ Internal testing completed
- ✅ All tests passing
- ✅ Gas optimization enabled (200 runs)

### Security Features
- ✅ ReentrancyGuard on all state-changing functions
- ✅ No admin/owner functions (immutable)
- ✅ OpenZeppelin battle-tested libraries
- ✅ Comprehensive test coverage

### Known Limitations
- Contracts are immutable after deployment
- No upgrade mechanism
- Parameters are hardcoded

## 📈 Gas Estimates

| Operation | Gas Cost |
|-----------|----------|
| Become Candidate | ~130,000 |
| Vote | ~80,000 |
| Create Buy Order | ~304,000 |
| Create Sell Order | ~343,000 |
| Fill Order | ~120,000 |
| Cancel Order | ~50,000 |

## 🧪 Test Coverage

```bash
npx hardhat coverage
```

Current coverage: 100% of critical functions

## 📝 Configuration

### Hardhat Config

```javascript
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
```

### Networks

- **hardhat**: Local development
- **localhost**: Local node
- **bscTestnet**: BSC Testnet
- **bsc**: BSC Mainnet

## 🔗 Deployed Addresses

See [../README.md](../README.md) for deployed contract addresses.

## 📞 Support

For questions about the contracts, please open an issue on GitHub.
