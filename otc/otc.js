// CPC OTC DApp - Uses same wallet logic as main DApp
console.log('💱 OTC.js loaded successfully');

let web3;
let userAccount;
let walletConnector = null;
let otcContract;
let cpcContract;
let updateInterval;

// Contract Configuration
const CONFIG = {
    OTC_CONTRACT: '0x9886e955DaD9ABcCC86980E1aC55cA2Ae57D5082',
    CPC_TOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9',
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

// Contract ABIs - Loaded from external JSON files via HTML
// OTC_ABI and CPC_ABI are loaded in otc.html

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

// Pagination
let currentPage = 1;
const ordersPerPage = 10;
let currentOrderType = 'buy';

// Initialize
window.addEventListener('load', async () => {
    setupEventListeners();
    setupOrderTypeTabs();
    setupWalletModal();
    setupRulesToggle();
    await initWeb3();
});

// Initialize Web3
let initRetryCount = 0;
const MAX_INIT_RETRIES = 50; // Max 5 seconds

async function initWeb3() {
    try {
        // Check if Web3 is loaded
        if (typeof Web3 === 'undefined') {
            initRetryCount++;
            if (initRetryCount < MAX_INIT_RETRIES) {
                console.log(`Waiting for Web3... (${initRetryCount}/${MAX_INIT_RETRIES})`);
                setTimeout(initWeb3, 100);
                return;
            } else {
                console.error('Web3 library failed to load after 5 seconds');
                showToast('Failed to load Web3 library. Please refresh the page.', 'error');
                return;
            }
        }

        // Check if WalletConnector is loaded
        if (typeof WalletConnector === 'undefined') {
            console.error('WalletConnector class not found');
            showToast('Wallet connector failed to load. Please refresh the page.', 'error');
            return;
        }

        walletConnector = new WalletConnector();
        console.log('Wallet connector initialized');

        // Check for stored wallet connection from any page
        const storedWalletType = localStorage.getItem('cc_wallet_type') || 
                                 localStorage.getItem('voting_wallet_type') || 
                                 localStorage.getItem('otc_wallet_type');

        // Auto-detect MetaMask connection
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0 && storedWalletType) {
                    // Already connected, use existing connection
                    web3 = new Web3(window.ethereum);
                    userAccount = accounts[0];
                    walletConnector.provider = window.ethereum;
                    walletConnector.web3 = web3;
                    walletConnector.walletType = 'metamask';
                    console.log('Auto-connected to MetaMask:', userAccount);
                    
                    // Sync wallet type across all pages
                    localStorage.setItem('otc_wallet_type', 'metamask');
                    
                    await initContracts();
                    updateWalletUI();
                    setupWalletEventListeners();
                    return;
                }
            } catch (error) {
                console.log('Auto-connect failed, manual connection required');
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
    if (!web3) {
        console.warn('Web3 not initialized');
        return;
    }
    
    if (!CONFIG.OTC_CONTRACT) {
        console.warn('OTC contract address not configured');
        return;
    }
    
    try {
        otcContract = new web3.eth.Contract(OTC_ABI, CONFIG.OTC_CONTRACT);
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
    const connectBtn = document.getElementById('connectWallet');
    const createBtn = document.getElementById('createOrderBtn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', () => showWalletModal());
    }
    if (createBtn) {
        createBtn.addEventListener('click', createOrder);
    }
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
        
        // Store wallet type across all pages for sync
        localStorage.setItem('otc_wallet_type', walletType);
        localStorage.setItem('cc_wallet_type', walletType);
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
        localStorage.removeItem('otc_wallet_type');
        updateWalletUI();
    }
}

// Disconnect Wallet
function disconnectWallet() {
    userAccount = null;
    web3 = null;
    otcContract = null;
    cpcContract = null;
    
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    // Clear wallet type from all pages
    localStorage.removeItem('otc_wallet_type');
    localStorage.removeItem('cc_wallet_type');
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
    const connectBtn = document.getElementById('connectWallet');
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
    if (!otcContract || !userAccount) return;

    try {
        await Promise.all([
            loadOrders(),
            loadUserBalance()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load Orders
async function loadOrders() {
    if (!otcContract) return;
    
    try {
        const activeCount = await otcContract.methods.getActiveOrderCount().call();
        document.getElementById('activeOrders').textContent = activeCount;
        
        const orderIds = await otcContract.methods.getActiveOrders(0, 50).call();
        const tbody = document.getElementById('orderTableBody');
        tbody.innerHTML = '';
        
        if (orderIds.length === 0) {
            tbody.innerHTML = '<tr class="no-orders"><td colspan="7"><i class="fas fa-inbox"></i><p>No active orders</p></td></tr>';
            return;
        }
        
        for (const orderId of orderIds) {
            const order = await otcContract.methods.orders(orderId).call();
            if (!order.isActive) continue;
            
            const row = document.createElement('tr');
            const isBuy = order.isBuyOrder;
            const tokenAmount = web3.utils.fromWei(order.remainingAmount, 'ether');
            const pricePerToken = web3.utils.fromWei(order.pricePerToken, 'ether');
            const totalValue = (parseFloat(tokenAmount) * parseFloat(pricePerToken)).toFixed(6);
            
            row.innerHTML = `
                <td data-label="Type"><span class="order-type ${isBuy ? 'buy' : 'sell'}">${isBuy ? 'BUY' : 'SELL'}</span></td>
                <td data-label="Amount">${parseFloat(tokenAmount).toFixed(2)} CPC</td>
                <td data-label="Price">${parseFloat(pricePerToken).toFixed(6)} BNB</td>
                <td data-label="Total">${totalValue} BNB</td>
                <td data-label="Creator">${formatAddress(order.creator)}</td>
                <td data-label="Time">${new Date(order.createdAt * 1000).toLocaleString()}</td>
                <td>
                    ${order.creator.toLowerCase() === userAccount.toLowerCase() 
                        ? `<button class="btn-cancel" onclick="cancelOrder(${orderId})">Cancel</button>`
                        : `<button class="btn-fill" onclick="fillOrder(${orderId}, ${isBuy})">Fill</button>`
                    }
                </td>
            `;
            tbody.appendChild(row);
        }
        
        await loadMyOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load My Orders
async function loadMyOrders() {
    if (!otcContract || !userAccount) return;
    
    try {
        const myOrderIds = await otcContract.methods.getUserOrders(userAccount).call();
        const container = document.getElementById('myOrdersContainer');
        container.innerHTML = '';
        
        if (myOrderIds.length === 0) {
            container.innerHTML = '<div class="no-orders"><i class="fas fa-inbox"></i><p>You haven\'t created any orders yet</p></div>';
            return;
        }
        
        for (const orderId of myOrderIds) {
            const order = await otcContract.methods.orders(orderId).call();
            const isBuy = order.isBuyOrder;
            const tokenAmount = web3.utils.fromWei(order.tokenAmount, 'ether');
            const remaining = web3.utils.fromWei(order.remainingAmount, 'ether');
            const pricePerToken = web3.utils.fromWei(order.pricePerToken, 'ether');
            
            const orderCard = document.createElement('div');
            orderCard.className = 'my-order-card';
            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-type ${isBuy ? 'buy' : 'sell'}">${isBuy ? 'BUY' : 'SELL'}</span>
                    <span class="order-status ${order.isActive ? 'active' : 'completed'}">${order.isActive ? 'Active' : 'Completed'}</span>
                </div>
                <div class="order-details">
                    <p>Amount: ${parseFloat(tokenAmount).toFixed(2)} CPC</p>
                    <p>Remaining: ${parseFloat(remaining).toFixed(2)} CPC</p>
                    <p>Price: ${parseFloat(pricePerToken).toFixed(6)} BNB</p>
                </div>
                ${order.isActive ? `<button class="btn-cancel" onclick="cancelOrder(${orderId})">Cancel Order</button>` : ''}
            `;
            container.appendChild(orderCard);
        }
    } catch (error) {
        console.error('Error loading my orders:', error);
    }
}

// Load User Balance
async function loadUserBalance() {
    if (!cpcContract || !userAccount) return;
    
    try {
        const balance = await cpcContract.methods.balanceOf(userAccount).call();
        const bnbBalance = await web3.eth.getBalance(userAccount);
        
        console.log('CPC Balance:', web3.utils.fromWei(balance, 'ether'));
        console.log('BNB Balance:', web3.utils.fromWei(bnbBalance, 'ether'));
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

// Create Order
async function createOrder() {
    if (!otcContract || !userAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    const amount = document.getElementById('orderAmount').value;
    const price = document.getElementById('orderPrice').value;
    const isBuy = document.querySelector('.tab-btn.active').dataset.type === 'buy';
    
    const amountNum = parseFloat(amount);
    if (!amount || !price || amountNum < 1 || !Number.isInteger(amountNum)) {
        showToast('Please enter valid amount (must be whole number, min 1 CPC) and price', 'error');
        return;
    }
    
    showLoading('Checking balance...');
    
    try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        const priceWei = web3.utils.toWei(price, 'ether');
        const totalValue = (parseFloat(amount) * parseFloat(price)).toFixed(6);
        const totalValueWei = web3.utils.toWei(totalValue, 'ether');
        
        // Check balance before proceeding
        const userBalance = await web3.eth.getBalance(userAccount);
        const userBalanceBNB = parseFloat(web3.utils.fromWei(userBalance, 'ether'));
        
        if (isBuy) {
            const requiredBNB = parseFloat(totalValue) + 0.001 + 0.002; // value + creation fee + estimated gas
            if (userBalanceBNB < requiredBNB) {
                hideLoading();
                showToast(`Insufficient BNB! You need at least ${requiredBNB.toFixed(4)} BNB (you have ${userBalanceBNB.toFixed(4)} BNB)`, 'error');
                return;
            }
        } else {
            const requiredBNB = 0.001 + 0.002; // creation fee + estimated gas
            if (userBalanceBNB < requiredBNB) {
                hideLoading();
                showToast(`Insufficient BNB for gas! You need at least ${requiredBNB.toFixed(4)} BNB (you have ${userBalanceBNB.toFixed(4)} BNB)`, 'error');
                return;
            }
            
            // Check CPC balance for sell orders
            const cpcBalance = await cpcContract.methods.balanceOf(userAccount).call();
            const cpcBalanceFormatted = parseFloat(web3.utils.fromWei(cpcBalance, 'ether'));
            if (cpcBalanceFormatted < parseFloat(amount)) {
                hideLoading();
                showToast(`Insufficient CPC! You need ${amount} CPC (you have ${cpcBalanceFormatted.toFixed(2)} CPC)`, 'error');
                return;
            }
        }
        
        showLoading(isBuy ? 'Creating buy order...' : 'Creating sell order...');
        
        if (isBuy) {
            const totalRequired = parseFloat(totalValue) + 0.001;
            
            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await otcContract.methods.createBuyOrder(amountWei, priceWei).estimateGas({
                    from: userAccount,
                    value: web3.utils.toWei(totalRequired.toString(), 'ether')
                });
                console.log('Gas estimate:', gasEstimate);
            } catch (estimateError) {
                console.error('Gas estimation failed:', estimateError);
                throw new Error('Transaction will fail: ' + (estimateError.message || 'Unknown error'));
            }
            
            // Get current gas price and increase it by 20% for faster confirmation
            const currentGasPrice = await web3.eth.getGasPrice();
            const gasPrice = Math.floor(currentGasPrice * 1.2);
            
            console.log('Sending transaction with gas:', Math.floor(gasEstimate * 1.2), 'gasPrice:', web3.utils.fromWei(gasPrice.toString(), 'gwei'), 'Gwei');
            console.log('Transaction params:', {
                from: userAccount,
                value: web3.utils.toWei(totalRequired.toString(), 'ether'),
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });
            
            const tx = await otcContract.methods.createBuyOrder(amountWei, priceWei).send({
                from: userAccount,
                value: web3.utils.toWei(totalRequired.toString(), 'ether'),
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            })
            .on('transactionHash', (hash) => {
                console.log('Transaction sent! Hash:', hash);
                showLoading('Transaction sent, waiting for confirmation...');
            })
            .on('receipt', (receipt) => {
                console.log('Transaction confirmed!', receipt);
            })
            .on('error', (error) => {
                console.error('Transaction error:', error);
            });
            
            console.log('Buy order created:', tx);
        } else {
            // Approve CPC first
            const allowance = await cpcContract.methods.allowance(userAccount, CONFIG.OTC_CONTRACT).call();
            if (web3.utils.toBN(allowance).lt(web3.utils.toBN(amountWei))) {
                showLoading('Approving CPC...');
                const approveTx = await cpcContract.methods.approve(CONFIG.OTC_CONTRACT, amountWei).send({ 
                    from: userAccount,
                    gas: 100000,
                    gasPrice: await web3.eth.getGasPrice()
                });
                console.log('Approval tx:', approveTx);
                
                // Wait a bit for approval to be confirmed
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            showLoading('Creating sell order...');
            
            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await otcContract.methods.createSellOrder(amountWei, priceWei).estimateGas({
                    from: userAccount,
                    value: web3.utils.toWei('0.001', 'ether')
                });
                console.log('Gas estimate:', gasEstimate);
            } catch (estimateError) {
                console.error('Gas estimation failed:', estimateError);
                throw new Error('Transaction will fail: ' + (estimateError.message || 'Unknown error'));
            }
            
            // Get current gas price and increase it by 20% for faster confirmation
            const currentGasPrice = await web3.eth.getGasPrice();
            const gasPrice = Math.floor(currentGasPrice * 1.2);
            
            console.log('Sending transaction with gas:', Math.floor(gasEstimate * 1.2), 'gasPrice:', web3.utils.fromWei(gasPrice.toString(), 'gwei'), 'Gwei');
            
            const tx = await otcContract.methods.createSellOrder(amountWei, priceWei).send({
                from: userAccount,
                value: web3.utils.toWei('0.001', 'ether'),
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });
            console.log('Sell order created:', tx);
        }
        
        showToast('Order created successfully!', 'success');
        document.getElementById('orderAmount').value = '';
        document.getElementById('orderPrice').value = '';
        await loadAllData();
        
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('Failed to create order: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        hideLoading();
    }
}

// Fill Order
async function fillOrder(orderId, isBuyOrder) {
    if (!otcContract || !userAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    showLoading('Filling order...');
    
    try {
        const order = await otcContract.methods.orders(orderId).call();
        
        if (isBuyOrder) {
            // Filling a buy order (seller provides CPC)
            const amount = order.remainingAmount;
            const allowance = await cpcContract.methods.allowance(userAccount, CONFIG.OTC_CONTRACT).call();
            
            if (web3.utils.toBN(allowance).lt(web3.utils.toBN(amount))) {
                showLoading('Approving CPC...');
                
                // Approve unlimited amount to avoid frequent approvals (shows as "Unlimited" in MetaMask)
                const approveAmount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // MaxUint256
                const approveTx = await cpcContract.methods.approve(CONFIG.OTC_CONTRACT, approveAmount).send({ 
                    from: userAccount,
                    gas: 100000
                });
                console.log('Approval tx:', approveTx);
                
                // Wait for approval to be confirmed
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Verify approval
                const newAllowance = await cpcContract.methods.allowance(userAccount, CONFIG.OTC_CONTRACT).call();
                console.log('New allowance:', web3.utils.fromWei(newAllowance, 'ether'), 'CPC');
                
                if (web3.utils.toBN(newAllowance).lt(web3.utils.toBN(amount))) {
                    throw new Error('Approval failed. Please try again.');
                }
            }
            
            showLoading('Filling buy order...');
            
            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await otcContract.methods.fillBuyOrder(orderId, 0).estimateGas({
                    from: userAccount
                });
                console.log('Gas estimate:', gasEstimate);
            } catch (estimateError) {
                console.error('Gas estimation failed:', estimateError);
                throw new Error('Transaction will fail: ' + (estimateError.message || 'Unknown error'));
            }
            
            // Get current gas price and increase it by 20%
            const currentGasPrice = await web3.eth.getGasPrice();
            const gasPrice = Math.floor(currentGasPrice * 1.2);
            
            const tx = await otcContract.methods.fillBuyOrder(orderId, 0).send({ 
                from: userAccount,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });
            console.log('Buy order filled:', tx);
        } else {
            // Filling a sell order (buyer provides BNB)
            const totalValue = (order.totalValue * order.remainingAmount) / order.tokenAmount;
            
            showLoading('Filling sell order...');
            
            // Estimate gas first
            let gasEstimate;
            try {
                gasEstimate = await otcContract.methods.fillSellOrder(orderId, 0).estimateGas({
                    from: userAccount,
                    value: totalValue
                });
                console.log('Gas estimate:', gasEstimate);
            } catch (estimateError) {
                console.error('Gas estimation failed:', estimateError);
                throw new Error('Transaction will fail: ' + (estimateError.message || 'Unknown error'));
            }
            
            // Get current gas price and increase it by 20%
            const currentGasPrice = await web3.eth.getGasPrice();
            const gasPrice = Math.floor(currentGasPrice * 1.2);
            
            const tx = await otcContract.methods.fillSellOrder(orderId, 0).send({
                from: userAccount,
                value: totalValue,
                gas: Math.floor(gasEstimate * 1.2),
                gasPrice: gasPrice
            });
            console.log('Sell order filled:', tx);
        }
        
        showToast('Order filled successfully!', 'success');
        await loadAllData();
        
    } catch (error) {
        console.error('Error filling order:', error);
        showToast('Failed to fill order: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        hideLoading();
    }
}

// Cancel Order
async function cancelOrder(orderId) {
    if (!otcContract || !userAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    showLoading('Cancelling order...');
    
    try {
        const tx = await otcContract.methods.cancelOrder(orderId).send({ from: userAccount });
        console.log('Order cancelled:', tx);
        showToast('Order cancelled successfully!', 'success');
        await loadAllData();
    } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Failed to cancel order: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        hideLoading();
    }
}

// Setup Order Type Tabs
function setupOrderTypeTabs() {
    const tabs = document.querySelectorAll('.tab-btn[data-type]');
    const amountInput = document.getElementById('orderAmount');
    const priceInput = document.getElementById('orderPrice');
    const createBtn = document.getElementById('createOrderBtn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentOrderType = tab.dataset.type;
            updateOrderSummary();
        });
    });
    
    // Update summary on input
    if (amountInput) {
        amountInput.addEventListener('input', updateOrderSummary);
    }
    if (priceInput) {
        priceInput.addEventListener('input', updateOrderSummary);
    }
    
    // Enable/disable create button
    function updateOrderSummary() {
        const amount = parseFloat(amountInput?.value || 0);
        const price = parseFloat(priceInput?.value || 0);
        
        if (amount >= 1 && price > 0) {
            const totalValue = (amount * price).toFixed(6);
            const totalRequired = (parseFloat(totalValue) + 0.001).toFixed(6);
            
            document.getElementById('totalValue').textContent = totalValue + ' BNB';
            document.getElementById('totalRequired').textContent = totalRequired + ' BNB';
            
            if (createBtn) createBtn.disabled = false;
        } else {
            document.getElementById('totalValue').textContent = '0 BNB';
            document.getElementById('totalRequired').textContent = '0.001 BNB';
            if (createBtn) createBtn.disabled = true;
        }
    }
    
    // Setup filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // TODO: Implement filtering
        });
    });
}

// Toggle Rules Function
function toggleRules(section) {
    const rulesContent = document.getElementById(`${section}-rules`);
    const toggleBtn = document.getElementById(`${section}-toggle`);
    
    if (rulesContent && toggleBtn) {
        const isCollapsed = rulesContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            rulesContent.classList.remove('collapsed');
            toggleBtn.classList.add('rotated');
        } else {
            rulesContent.classList.add('collapsed');
            toggleBtn.classList.remove('rotated');
        }
    }
}

// Copy Address Function
function copyAddress(address) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(() => {
            showCopySuccess();
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(address);
        });
    } else {
        fallbackCopy(address);
    }
}

// Show copy success message
function showCopySuccess() {
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> Address copied to clipboard!';
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
}

// Fallback copy method
function fallbackCopy(address) {
    const textarea = document.createElement('textarea');
    textarea.value = address;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Failed to copy:', err);
    }
    
    document.body.removeChild(textarea);
}

// Setup Rules Toggle
function setupRulesToggle() {
    const headers = document.querySelectorAll('.rules-header-inline');
    
    headers.forEach(header => {
        const section = header.getAttribute('data-section');
        
        if (section) {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                toggleRules(section);
            });
            
            // Initialize as collapsed
            const rulesContent = document.getElementById(`${section}-rules`);
            if (rulesContent) {
                rulesContent.classList.add('collapsed');
            }
        }
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


// ============================================================================
// Page Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 OTC page loaded, initializing...');
    
    // Hide loading overlay immediately
    hideLoading();
    
    // Check for previously connected wallet
    checkPreviousConnection();
});

// Check for previously connected wallet from localStorage
async function checkPreviousConnection() {
    const savedAddress = localStorage.getItem('connectedWallet');
    const savedProvider = localStorage.getItem('walletProvider');
    
    if (savedAddress && savedProvider && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });
            
            if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
                // Wallet still connected, restore session
                userAccount = accounts[0];
                web3 = new Web3(window.ethereum);
                
                // Initialize contracts
                otcContract = new web3.eth.Contract(OTC_ABI, CONFIG.OTC_CONTRACT);
                cpcContract = new web3.eth.Contract(CPC_ABI, CONFIG.CPC_TOKEN);
                
                // Update UI
                updateWalletUI();
                
                console.log('✅ Restored wallet connection:', userAccount);
                
                // Load data
                loadOrders();
                loadMyBalance();
            } else {
                // Clear stale data
                localStorage.removeItem('connectedWallet');
                localStorage.removeItem('walletProvider');
            }
        } catch (error) {
            console.log('Could not restore wallet connection:', error);
            localStorage.removeItem('connectedWallet');
            localStorage.removeItem('walletProvider');
        }
    }
}
