# Deployment Guide

Complete guide for deploying CPC smart contracts and frontend.

## 📋 Prerequisites

- Node.js >= 16.x
- Hardhat
- BSC wallet with BNB for gas
- BSCScan API key (for verification)

## 🔧 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/CPC-OpenSource.git
cd CPC-OpenSource
```

### 2. Install Dependencies

```bash
# Install contract dependencies
cd contracts
npm install

# Install dapp dependencies
cd ../dapp
npm install
```

### 3. Configure Environment

```bash
cd contracts
cp .env.example .env
```

Edit `.env`:
```env
PRIVATE_KEY=your_private_key_without_0x
BSCSCAN_API_KEY=your_bscscan_api_key
```

## 🚀 Contract Deployment

### Step 1: Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Step 2: Run Tests

```bash
npx hardhat test
```

Ensure all tests pass before deploying.

### Step 3: Deploy to BSC Testnet (Recommended First)

```bash
npx hardhat run scripts/deploy-otc-voting.js --network bscTestnet
```

### Step 4: Deploy to BSC Mainnet

```bash
npx hardhat run scripts/deploy-otc-voting.js --network bsc
```

**Save the deployed addresses!**

### Step 5: Verify Contracts

```bash
# Verify Voting Contract
npx hardhat verify --network bsc <VOTING_ADDRESS> "0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9"

# Verify OTC Contract
npx hardhat verify --network bsc <OTC_ADDRESS> "0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9" "<VOTING_ADDRESS>"
```

## 🌐 Frontend Deployment

### Update Contract Addresses

#### DApp (dapp/script.js)
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

#### OTC (otc/otc.js)
```javascript
const CONFIG = {
    OTC_CONTRACT: 'YOUR_DEPLOYED_OTC_ADDRESS',
    CPC_TOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9'
};
```

#### Voting (voting/voting.js)
```javascript
const CONFIG = {
    VOTING_CONTRACT: 'YOUR_DEPLOYED_VOTING_ADDRESS',
    CPC_TOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9'
};
```

### Deploy Frontend

#### Option 1: Static Hosting (Vercel, Netlify)

```bash
# Build
cd dapp
npm run build

# Deploy to Vercel
vercel deploy

# Or Netlify
netlify deploy
```

#### Option 2: Traditional Server

```bash
# Upload files to server
scp -r dapp/* user@server:/var/www/cpc-dapp/
scp -r otc/* user@server:/var/www/cpc-otc/
scp -r voting/* user@server:/var/www/cpc-voting/

# Configure nginx
sudo nano /etc/nginx/sites-available/cpc
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /var/www/cpc-dapp;
        index index.html;
    }
    
    location /otc {
        alias /var/www/cpc-otc;
        index otc.html;
    }
    
    location /voting {
        alias /var/www/cpc-voting;
        index voting.html;
    }
}
```

#### Option 3: IPFS (Decentralized)

```bash
# Install IPFS
npm install -g ipfs

# Add to IPFS
ipfs add -r dapp/
ipfs add -r otc/
ipfs add -r voting/

# Pin to Pinata or other service
```

## ✅ Post-Deployment Checklist

### Contracts
- [ ] All contracts deployed
- [ ] All contracts verified on BSCScan
- [ ] Deployment addresses saved
- [ ] Test transactions completed

### Frontend
- [ ] Contract addresses updated
- [ ] All pages accessible
- [ ] Wallet connection works
- [ ] All functions tested

### Documentation
- [ ] README updated with addresses
- [ ] User guide published
- [ ] API documentation complete

### Security
- [ ] Private keys secured
- [ ] .env files not committed
- [ ] Contracts audited
- [ ] Emergency contacts ready

## 🔍 Verification

### Test Each Function

1. **DApp**
   - Connect wallet
   - Claim airdrop
   - Purchase NFT
   - Stake tokens

2. **OTC**
   - Create buy order
   - Create sell order
   - Fill order
   - Cancel order

3. **Voting**
   - Become candidate
   - Cast vote
   - View leaderboard
   - Claim revenue (after round)

## 🐛 Troubleshooting

### Contract Verification Fails

Try manual verification:
1. Go to BSCScan contract page
2. Click "Verify and Publish"
3. Select "Solidity (Single file)"
4. Compiler: v0.8.24+commit.e11b9ed9
5. Optimization: Yes, 200 runs
6. Paste flattened contract code

### Frontend Not Connecting

1. Check contract addresses
2. Verify network (BSC Mainnet, Chain ID 56)
3. Check browser console for errors
4. Ensure MetaMask is installed

### Transactions Failing

1. Check gas price
2. Verify sufficient balance
3. Check contract state
4. Review transaction data

## 📞 Support

For deployment issues:
- Check GitHub issues
- Review documentation
- Contact development team

## 🔄 Updates

To update contracts:
1. Deploy new version
2. Update frontend addresses
3. Announce to users
4. Provide migration guide

**Note**: Current contracts are immutable and cannot be upgraded.

## 📝 Deployment Log Template

```
Deployment Date: YYYY-MM-DD
Network: BSC Mainnet
Deployer: 0x...

Contracts:
- Voting: 0x...
- OTC: 0x...

Verification:
- Voting: ✅ Verified
- OTC: ✅ Verified

Frontend:
- DApp: https://...
- OTC: https://.../otc
- Voting: https://.../voting

Status: ✅ Live
```
