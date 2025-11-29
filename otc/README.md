# CPC OTC Trading Platform

Peer-to-peer trading platform for CPC tokens with minimal fees.

## 🌟 Features

- 📝 **Create Orders**: Buy or sell CPC tokens
- 💱 **P2P Trading**: Direct peer-to-peer transactions
- 💰 **Low Fees**: 0.001 BNB creation + 0.2% trading fee
- 🔄 **Partial Fills**: Orders can be partially filled
- ❌ **Cancel Anytime**: Cancel unfilled orders

## 🚀 Quick Start

### Access

Open `otc.html` in a web browser with MetaMask installed.

### Usage

1. **Connect Wallet**
2. **Create Order**
   - Choose buy or sell
   - Enter amount and price
   - Pay creation fee (0.001 BNB)
3. **Fill Orders**
   - Browse active orders
   - Click to fill
   - Confirm transaction
4. **Manage Orders**
   - View your orders
   - Cancel if needed

## 📊 Fee Structure

| Fee Type | Amount | Destination |
|----------|--------|-------------|
| Order Creation | 0.001 BNB (paid by buyer) | Monthly X Giveaway Winner |
| Trading Fee | 0.2% of trade value (deducted from seller) | Monthly X Giveaway Winner |

## 🔧 Configuration

Update contract address in `otc.js`:

```javascript
const CONFIG = {
    OTC_CONTRACT: 'YOUR_OTC_CONTRACT_ADDRESS',
    CPC_TOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9'
};
```

## 📝 Order Types

### Buy Order
- Deposit BNB upfront
- Sellers fill with CPC tokens
- Receive CPC when filled

### Sell Order
- Deposit CPC tokens upfront
- Buyers fill with BNB
- Receive BNB when filled

## 💡 Examples

### Create Buy Order
```
Amount: 100 CPC
Price: 0.01 BNB per CPC
Total: 1 BNB + 0.001 BNB fee
```

### Create Sell Order
```
Amount: 100 CPC
Price: 0.01 BNB per CPC
Fee: 0.001 BNB
```

### Fill Order
```
Fill Amount: 50 CPC (partial fill)
Trading Fee: 0.2% of trade value
```

## 🔒 Security

- ✅ Escrow system (funds locked in contract)
- ✅ ReentrancyGuard protection
- ✅ No admin control
- ✅ Immutable contract

## 📱 Mobile Support

Works on mobile browsers with:
- MetaMask Mobile
- Trust Wallet
- Binance Chain Wallet

## 🐛 Troubleshooting

### Order Creation Fails
- Check BNB balance (need 0.001 + order value)
- For sell orders, approve CPC tokens first

### Cannot Fill Order
- Check if you have sufficient balance
- For buy orders, need CPC tokens
- For sell orders, need BNB

### Order Not Showing
- Refresh the page
- Check if order was cancelled
- Verify network connection

## 📞 Support

For issues, please open a GitHub issue.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.
