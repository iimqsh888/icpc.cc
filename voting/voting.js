// CPC Voting DApp
console.log('Voting.js loaded successfully');

let web3;
let userAccount;
let walletConnector = null;
let votingContract;
let cpcContract;
let updateInterval;

// Contract Configuration
const CONFIG = {
    CPC_TOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9',
    VOTING_CONTRACT: '0x996586AC713b0206352c8073273407342D7080D5',
    CHAIN_ID: 56,
    CHAIN_NAME: 'BSC Mainnet',
    BLOCK_EXPLORER: 'https://bscscan.com'
};

// BSC Network Configuration
const BSC_CONFIG = {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
};

// Contract ABIs - 标准JSON格式
const VOTING_ABI = [
    {
        "inputs": [],
        "name": "cpcToken",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "currentRevenueHolder",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "votingRound",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "roundStartTime",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "roundEndTime",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ROUND_DURATION",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "CANDIDATE_STAKE",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "becomeCandidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "candidate", "type": "address"}],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimRevenueRight",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const ERC20_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "address", "name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Initialize
window.addEventListener('load', async () => {
    await initWeb3();
    setupEventListeners();
    setupTabSwitching();
    setupWalletModal();
});

// Initialize Web3
async function initWeb3() {
    try {
        walletConnector = new WalletConnector();
        console.log('Wallet connector initialized');

        if (typeof Web3 === 'undefined') {
            console.warn('Web3 library not loaded yet');
            updateWalletUI();
            return;
        }

        // 尝试重新连接之前的钱包
        const storedWalletType = localStorage.getItem('voting_wallet_type');
        if (storedWalletType) {
            try {
                if (storedWalletType === 'metamask' && typeof window.ethereum !== 'undefined') {
                    web3 = new Web3(window.ethereum);
                    const accounts = await web3.eth.getAccounts();
                    if (accounts.length > 0) {
                        userAccount = accounts[0];
                        walletConnector.provider = window.ethereum;
                        walletConnector.web3 = web3;
                        walletConnector.walletType = storedWalletType;
                        console.log('Reconnected to MetaMask:', userAccount);
                        await initContracts();
                    }
                }
            } catch (error) {
                console.log('Failed to reconnect:', error);
                localStorage.removeItem('voting_wallet_type');
            }
        }

        updateWalletUI();
        setupWalletEventListeners();

    } catch (error) {
        console.error('Error initializing Web3:', error);
        updateWalletUI();
    }
}

// Initialize Contracts
async function initContracts() {
    if (!web3 || !CONFIG.VOTING_CONTRACT) return;
    
    try {
        votingContract = new web3.eth.Contract(VOTING_ABI, CONFIG.VOTING_CONTRACT);
        cpcContract = new web3.eth.Contract(ERC20_ABI, CONFIG.CPC_TOKEN);
        console.log('Contracts initialized');
        
        await loadAllData();
        
        // Start auto-refresh
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(loadAllData, 15000);
    } catch (error) {
        console.error('Error initializing contracts:', error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('connectWalletBtn').addEventListener('click', () => showWalletModal());
    document.getElementById('disconnectBtn').addEventListener('click', disconnectWallet);
    document.getElementById('becomeCandidateBtn').addEventListener('click', becomeCandidate);
    document.getElementById('voteBtn').addEventListener('click', castVote);
    document.getElementById('claimBtn').addEventListener('click', claimRevenueRight);
    document.getElementById('refreshLeaderboard').addEventListener('click', loadAllData);
}

// Setup Wallet Modal
function setupWalletModal() {
    const modal = document.getElementById('walletModal');
    const closeBtn = document.getElementById('closeWalletModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWalletModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideWalletModal();
        });
    }
    
    // Wallet option clicks
    document.querySelectorAll('.wallet-option').forEach(option => {
        option.addEventListener('click', () => {
            const walletType = option.dataset.wallet;
            connectWallet(walletType);
        });
    });
}

function showWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.classList.add('active');
}

function hideWalletModal() {
    const modal = document.getElementById('walletModal');
    if (modal) modal.classList.remove('active');
}

// Connect Wallet
async function connectWallet(walletType = null) {
    if (!walletType) {
        showWalletModal();
        return;
    }

    hideWalletModal();
    showLoading('Connecting wallet...');

    try {
        if (!walletConnector) {
            throw new Error('Wallet connector not initialized');
        }

        userAccount = await walletConnector.connect(walletType);
        if (!userAccount) {
            throw new Error('Failed to get account');
        }

        web3 = walletConnector.web3;
        if (!web3) {
            throw new Error('Failed to initialize Web3');
        }

        console.log('Wallet connected:', userAccount);
        localStorage.setItem('voting_wallet_type', walletType);

        await ensureBSCNetwork();
        await initContracts();
        
        updateWalletUI();
        setupWalletEventListeners();
        
        hideLoading();
        showToast('Wallet connected successfully', 'success');

    } catch (error) {
        console.error('Wallet connection error:', error);
        hideLoading();
        
        if (error.code === 4001) {
            showToast('Connection cancelled', 'error');
        } else {
            showToast('Failed to connect wallet', 'error');
        }
        
        userAccount = null;
        localStorage.removeItem('voting_wallet_type');
        updateWalletUI();
    }
}

// Disconnect Wallet
function disconnectWallet() {
    userAccount = null;
    web3 = null;
    votingContract = null;
    cpcContract = null;
    
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    localStorage.removeItem('voting_wallet_type');
    updateWalletUI();
    showToast('Wallet disconnected', 'info');
}

// Ensure BSC Network
async function ensureBSCNetwork() {
    try {
        if (!walletConnector || !walletConnector.web3) {
            throw new Error('Wallet not connected');
        }

        const chainId = await walletConnector.getChainId();
        console.log('Current chain ID:', chainId);

        if (chainId !== 56) {
            console.log('Switching to BSC network...');
            await walletConnector.switchToBSC();
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newChainId = await walletConnector.getChainId();
            if (newChainId !== 56) {
                throw new Error('Failed to switch to BSC network');
            }
            console.log('Successfully switched to BSC network');
        }
    } catch (error) {
        console.error('Network switch error:', error);
        throw error;
    }
}

// Setup Wallet Event Listeners
let eventListenersSetup = false;
function setupWalletEventListeners() {
    if (eventListenersSetup || !walletConnector || !walletConnector.provider) return;

    walletConnector.setupEventListeners({
        onAccountsChanged: async (accounts) => {
            if (accounts.length > 0) {
                userAccount = accounts[0];
                updateWalletUI();
                await loadAllData();
            } else {
                disconnectWallet();
            }
        },
        onChainChanged: (chainId) => {
            const newChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
            if (newChainId === 56) {
                loadAllData();
            } else {
                showToast('Please switch to BSC Mainnet', 'warning');
            }
        },
        onDisconnect: () => {
            disconnectWallet();
        }
    });

    eventListenersSetup = true;
}

// Update Wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');

    if (userAccount) {
        if (connectBtn) connectBtn.style.display = 'none';
        if (walletInfo) walletInfo.style.display = 'flex';
        if (walletAddress) walletAddress.textContent = formatAddress(userAccount);
    } else {
        if (connectBtn) connectBtn.style.display = 'flex';
        if (walletInfo) walletInfo.style.display = 'none';
    }
}

// Load All Data
async function loadAllData() {
    if (!votingContract || !userAccount) return;

    try {
        await Promise.all([
            loadVotingStats(),
            loadLeaderboard(),
            loadUserStatus()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load Voting Stats
async function loadVotingStats() {
    // TODO: 实现统计数据加载
    console.log('Loading voting stats...');
}

// Load Leaderboard
async function loadLeaderboard() {
    // TODO: 实现排行榜加载
    console.log('Loading leaderboard...');
}

// Load User Status
async function loadUserStatus() {
    // TODO: 实现用户状态加载
    console.log('Loading user status...');
}

// Become Candidate
async function becomeCandidate() {
    if (!votingContract || !userAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }

    showLoading('Becoming candidate...');

    try {
        const tx = await votingContract.methods.becomeCandidate().send({
            from: userAccount
        });

        console.log('Transaction:', tx);
        showToast('Successfully became candidate!', 'success');
        await loadAllData();

    } catch (error) {
        console.error('Error becoming candidate:', error);
        showToast('Failed to become candidate', 'error');
    } finally {
        hideLoading();
    }
}

// Cast Vote
async function castVote() {
    if (!votingContract || !userAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }

    const candidateAddress = document.getElementById('voteAddress').value;
    if (!candidateAddress || !web3.utils.isAddress(candidateAddress)) {
        showToast('Please enter valid candidate address', 'error');
        return;
    }

    showLoading('Casting vote...');

    try {
        const tx = await votingContract.methods.vote(candidateAddress).send({
            from: userAccount
        });

        console.log('Transaction:', tx);
        showToast('Vote cast successfully!', 'success');
        await loadAllData();

    } catch (error) {
        console.error('Error casting vote:', error);
        showToast('Failed to cast vote', 'error');
    } finally {
        hideLoading();
    }
}

// Claim Revenue Right
async function claimRevenueRight() {
    if (!votingContract || !userAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }

    showLoading('Claiming revenue right...');

    try {
        const tx = await votingContract.methods.claimRevenueRight().send({
            from: userAccount
        });

        console.log('Transaction:', tx);
        showToast('Revenue right claimed successfully!', 'success');
        await loadAllData();

    } catch (error) {
        console.error('Error claiming revenue right:', error);
        showToast('Failed to claim revenue right', 'error');
    } finally {
        hideLoading();
    }
}

// Setup Tab Switching
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Utility Functions
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (overlay) overlay.style.display = 'flex';
    if (loadingText) loadingText.textContent = text;
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
