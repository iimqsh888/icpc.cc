# CPC Voting System

Community governance system for distributing OTC trading revenue.

## 🌟 Features

- 🗳️ **Democratic Voting**: One address, one vote
- 💰 **Revenue Distribution**: Winner receives OTC fees for 30 days
- 🎯 **30-Day Rounds**: New voting round every month
- 🆓 **Free Voting**: Only requires 1 CPC balance
- 🏆 **Fair Competition**: Transparent on-chain voting

## 🚀 Quick Start

### Access

Open `voting.html` in a web browser with MetaMask installed.

### How to Participate

1. **Become a Candidate**
   - Stake 1 CPC
   - Enter the current round
   - Stake returned after round ends

2. **Vote**
   - Hold at least 1 CPC
   - Vote for your favorite candidate
   - One vote per address per round

3. **Claim Revenue Right**
   - Winner claims after round ends
   - Receives OTC fees for next 30 days
   - New round starts immediately

## 📊 System Overview

### Voting Rounds

| Parameter | Value |
|-----------|-------|
| Duration | 30 days |
| Candidate Stake | 1 CPC |
| Minimum Vote Balance | 1 CPC |
| Voting Cost | Free (gas only) |

### Revenue Distribution

- **First Round**: Accumulated fees given to winner
- **Subsequent Rounds**: Real-time fee forwarding for 30 days
- **Fees Source**: OTC trading platform (0.2% + 0.001 BNB)

## 🔧 Configuration

Update contract address in `voting.js`:

```javascript
const CONFIG = {
    VOTING_CONTRACT: 'YOUR_VOTING_CONTRACT_ADDRESS',
    CPC_TOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9'
};
```

## 💡 How It Works

### 1. Candidate Registration
```
Stake: 1 CPC
Duration: Until round ends
Refund: After round ends
```

### 2. Voting Process
```
Requirement: Hold 1 CPC
Cost: Free (only gas)
Limit: One vote per round
Restriction: Cannot vote for yourself
```

### 3. Revenue Claiming
```
Eligibility: Round winner
Timing: After round ends
Reward: OTC fees for 30 days
```

### 4. Stake Withdrawal
```
Timing: After round ends
Amount: 1 CPC returned
Process: Manual withdrawal
```

## 📈 Example Timeline

```
Day 0: Round 1 starts
Day 1-29: Voting period
Day 30: Round 1 ends
Day 30: Winner claims revenue right
Day 30: Round 2 starts
Day 30-59: Winner receives OTC fees
Day 60: Round 2 ends, new winner claims
```

## 🏆 Leaderboard

View real-time rankings:
- Candidate addresses
- Vote counts
- Current leader
- Time remaining

## 🔒 Security

- ✅ One vote per address
- ✅ Cannot vote for yourself
- ✅ Transparent on-chain
- ✅ No admin control
- ✅ Immutable rules

## 📱 Mobile Support

Works on mobile browsers with:
- MetaMask Mobile
- Trust Wallet
- Binance Chain Wallet

## 🐛 Troubleshooting

### Cannot Become Candidate
- Check CPC balance (need at least 1 CPC)
- Approve CPC tokens first
- Check if already a candidate

### Cannot Vote
- Need at least 1 CPC balance
- Check if already voted this round
- Cannot vote for yourself
- Verify candidate is registered

### Cannot Claim
- Only winner can claim
- Wait until round ends
- Check if already claimed

## 📊 Statistics

View system statistics:
- Current round number
- Time remaining
- Total candidates
- Prize pool size
- Current revenue holder

## 📞 Support

For issues, please open a GitHub issue.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.
