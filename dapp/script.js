// Web3 and Contract Configuration
console.log('🚀 Script.js loaded successfully');
let web3;
let userAccount;
let walletConnector = null;
let currentGasPrice = null;

// Gas monitoring removed - let MetaMask handle all gas estimation

// Estimate transaction cost in BNB
function estimateTransactionCost(gasEstimate) {
    if (!gasEstimate || !currentGasPrice) return null;
    
    try {
        // Convert gas price from Gwei to Wei, then calculate total cost
        const gasPriceWei = web3.utils.toWei(currentGasPrice.toString(), 'gwei');
        const totalCostWei = BigInt(gasEstimate) * BigInt(gasPriceWei);
        const totalCostBNB = parseFloat(web3.utils.fromWei(totalCostWei.toString(), 'ether'));
        
        return totalCostBNB;
    } catch (error) {
        console.warn('Failed to estimate transaction cost:', error);
        return null;
    }
}

// Get current gas price from network
async function updateGasPrice() {
    if (!web3) return;
    
    try {
        const gasPriceWei = await web3.eth.getGasPrice();
        currentGasPrice = parseFloat(web3.utils.fromWei(gasPriceWei, 'gwei'));
        console.log(`Current gas price: ${currentGasPrice.toFixed(2)} Gwei`);
    } catch (error) {
        console.warn('Failed to get gas price:', error);
        // Use default BSC gas price (3 Gwei)
        currentGasPrice = 3;
    }
}

// Removed gas estimation - let wallet handle all gas calculations

// BSC Network Configuration
const BSC_CONFIG = {
    chainId: '0x38', // BSC Mainnet
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
};

// Contract Configuration - Use deployed addresses
const CONTRACTS = (typeof CONTRACT_CONFIG !== 'undefined' && CONTRACT_CONFIG) ? CONTRACT_CONFIG.ADDRESSES : {
    CPCTOKEN: '0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9',
    REWARDNFT: '0x4313EfBcc53Fe8DEAe8e55Af55AA9c6cBC57f359',
    AIRDROP: '0x9929858f17FD3B3e2D012AB6bB729603D1B88B07',
    MINING: '0x0fd5dFf70E3c8a672FDF6b2126114389B4Ea7743',
    PRESALE: '0xd6906C076e902E44C7adc8FcC190d4b1f687Ac1d',
    BABT: '0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8'
};

// BABT Contract Configuration (Binance Account Bound Token)
const BABT_CONFIG = {
    address: CONTRACTS.BABT,
    abi: [
        {
            "constant": true,
            "inputs": [{"name": "owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "type": "function"
        }
    ]
};

// Initialize Web3 and Contracts - No auto wallet connection
async function initWeb3() {
    try {
        // Initialize wallet connector first (doesn't need Web3)
        walletConnector = new WalletConnector();
        console.log('Wallet connector initialized');
        
        // Check if Web3 is loaded for reconnection attempts
        if (typeof Web3 === 'undefined') {
            console.warn('Web3 library not loaded yet, skipping auto-reconnection');
            // Still continue with basic initialization
            updateWalletUI();
            loadBasicTokenInfo();
            return;
        }
        
        // Check for stored wallet type and try to reconnect
        const storedWalletType = localStorage.getItem('cc_wallet_type');
        
        if (storedWalletType) {
            try {
                // Try to reconnect to the previous wallet
                if (storedWalletType === 'metamask' && typeof window.ethereum !== 'undefined') {
                    web3 = new Web3(window.ethereum);
                    const accounts = await web3.eth.getAccounts();
                    if (accounts.length > 0) {
                        userAccount = accounts[0];
                        walletConnector.provider = window.ethereum;
                        walletConnector.web3 = web3;
                        walletConnector.walletType = storedWalletType;
                        console.log('Reconnected to MetaMask:', userAccount);
                    }
                } else if (storedWalletType === 'binance' && typeof window.BinanceChain !== 'undefined') {
                    web3 = new Web3(window.BinanceChain);
                    const accounts = await web3.eth.getAccounts();
                    if (accounts.length > 0) {
                        userAccount = accounts[0];
                        walletConnector.provider = window.BinanceChain;
                        walletConnector.web3 = web3;
                        walletConnector.walletType = storedWalletType;
                        console.log('Reconnected to Binance Wallet:', userAccount);
                    }
                }
            } catch (reconnectError) {
                console.log('Failed to reconnect wallet:', reconnectError);
                localStorage.removeItem('cc_wallet_type');
            }
        }
        
        updateWalletUI();
        
        // Setup wallet event listeners
        setupWalletEventListeners();
        
        // Load basic token info that doesn't require wallet connection
        await loadBasicTokenInfo();
        
    } catch (error) {
        console.error('Error initializing Web3:', error);
        updateWalletUI();
    }
}

// Switch to BSC Network
async function switchToBSC() {
    try {
        if (walletConnector && walletConnector.provider) {
            await walletConnector.switchToBSC();
        } else {
            throw new Error('No wallet connected');
        }
    } catch (switchError) {
        console.error('Failed to switch to BSC network:', switchError);
        throw switchError;
    }
}

// Show wallet selection modal
function showWalletModal() {
    console.log('showWalletModal called');
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.classList.add('active');
        console.log('Modal shown');
    } else {
        console.error('Wallet modal not found in DOM');
    }
}

// Hide wallet selection modal
function hideWalletModal() {
    console.log('hideWalletModal called');
    const modal = document.getElementById('walletModal');
    if (modal) {
        modal.classList.remove('active');
        console.log('Modal hidden');
    }
}

// Connect Wallet
async function connectWallet(walletType = null) {
    console.log('connectWallet called with walletType:', walletType);
    
    const connectBtn = document.getElementById('connectWallet');
    const originalText = connectBtn ? connectBtn.innerHTML : '';
    
    try {
        // If no wallet type specified, show modal
        if (!walletType) {
            console.log('No wallet type specified, showing modal');
            showWalletModal();
            return;
        }

        // Hide modal
        hideWalletModal();

        // Show connecting status
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            connectBtn.disabled = true;
        }

        // Check if wallet connector is initialized
        if (!walletConnector) {
            throw new Error('Wallet connector not initialized. Please refresh the page.');
        }

        // Connect using wallet connector
        console.log('Connecting to wallet:', walletType);
        userAccount = await walletConnector.connect(walletType);
        
        if (!userAccount) {
            throw new Error('Failed to get account from wallet');
        }
        
        web3 = walletConnector.web3;
        
        if (!web3) {
            throw new Error('Failed to initialize Web3');
        }

        console.log('Wallet connected:', userAccount);

        // Store wallet type
        localStorage.setItem('cc_wallet_type', walletType);

        // Check and switch to BSC network
        await ensureBSCNetwork();
        
        // Update gas price
        await updateGasPrice();
        
        updateWalletUI();
        await loadContractData();
        
        // Setup event listeners
        setupWalletEventListeners();
        
        console.log('Wallet connection successful');
        
    } catch (error) {
        console.error('Wallet connection error:', error);
        
        // Reset button
        if (connectBtn) {
            connectBtn.innerHTML = originalText;
            connectBtn.disabled = false;
        }
        
        // Log error messages (no alerts)
        if (error.code === 4001) {
            console.log('User cancelled the connection request');
        } else if (error.code === -32002) {
            console.log('Connection request already pending. Please check your wallet.');
        } else if (error.message.includes('not installed')) {
            console.log(error.message + ' - Please install the wallet or try another option.');
        } else if (error.message.includes('network')) {
            console.log('Network error. Please ensure you are connected to BSC network.');
        } else if (error.message.includes('Signature rejected by user')) {
            console.log('User cancelled the signature request');
        } else if (error.message.includes('signature')) {
            console.log('Signature rejected. Please sign to complete authentication.');
        } else {
            console.log(`Failed to connect wallet: ${error.message}`);
        }
        
        // Clear any partial state
        userAccount = null;
        localStorage.removeItem('cc_wallet_type');
        updateWalletUI();
    }
}

// Ensure BSC Network Connection
async function ensureBSCNetwork() {
    try {
        if (!walletConnector || !walletConnector.web3) {
            throw new Error('Wallet not connected');
        }
        
        const chainId = await walletConnector.getChainId();
        console.log('Current chain ID:', chainId);
        
        if (chainId !== 56) {
            console.log('Not on BSC network. Current chain:', chainId, 'Required: 56 (BSC Mainnet)');
            console.log('Switching to BSC network...');
            
            await switchToBSC();
            
            // Wait a moment for the switch to complete
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Verify the switch was successful
            const newChainId = await walletConnector.getChainId();
            console.log('New chain ID after switch:', newChainId);
            
            if (newChainId !== 56) {
                throw new Error('Failed to switch to BSC network. Please switch manually.');
            }
            console.log('Successfully switched to BSC network');
        } else {
            console.log('Already on BSC network');
        }
    } catch (error) {
        console.error('Network switch error:', error);
        if (error.code === 4902) {
            throw new Error('BSC network not found. Please add BSC network manually.');
        } else if (error.code === 4001) {
            throw new Error('Network switch rejected. Please switch to BSC network manually.');
        }
        throw error;
    }
}

// Setup Wallet Event Listeners (prevent duplicate listeners)
let eventListenersSetup = false;
function setupWalletEventListeners() {
    if (eventListenersSetup || !walletConnector || !walletConnector.provider) return;
    
    // Global handlers for WalletConnect
    window.handleAccountsChanged = async (accounts) => {
        console.log('Accounts changed:', accounts);
        
        if (accounts.length > 0) {
            const newAccount = accounts[0];
            if (newAccount !== userAccount) {
                userAccount = newAccount;
                try {
                    const chainId = await walletConnector.getChainId();
                    if (chainId === 56) {
                        updateWalletUI();
                        await loadContractData();
                    } else {
                        updateWalletUI();
                    }
                } catch (error) {
                    console.error('Error handling account change:', error);
                    userAccount = null;
                    updateWalletUI();
                }
            }
        } else {
            console.log('User disconnected');
            userAccount = null;
            localStorage.removeItem('cc_wallet_type');
            updateWalletUI();
        }
    };
    
    window.handleChainChanged = (chainId) => {
        console.log('Chain changed:', chainId);
        const newChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
        console.log('New chain ID (decimal):', newChainId, 'Expected: 56 (BSC)');
        
        if (newChainId === 56) {
            console.log('Switched to BSC network - reconnecting...');
            if (userAccount) {
                updateWalletUI();
                loadContractData();
            }
        } else {
            console.warn('Not on BSC network! Current chain:', newChainId);
            updateWalletUI();
            
            if (userAccount) {
                console.warn(`Wrong network detected! Please switch to BSC Mainnet (Chain ID: 56). Current network: ${newChainId}`);
            }
        }
    };
    
    window.handleDisconnect = () => {
        console.log('Wallet disconnected');
        userAccount = null;
        localStorage.removeItem('cc_wallet_type');
        updateWalletUI();
    };
    
    // Setup listeners using wallet connector
    walletConnector.setupEventListeners({
        onAccountsChanged: window.handleAccountsChanged,
        onChainChanged: window.handleChainChanged,
        onDisconnect: window.handleDisconnect
    });
    
    eventListenersSetup = true;
}

// Removed authenticateUser and apiCall functions - no backend authentication needed

// Update Wallet UI
function updateWalletUI() {
    console.log('updateWalletUI called, userAccount:', userAccount);
    
    const connectBtn = document.getElementById('connectWallet');
    const connectBtnMobile = document.getElementById('connectWalletMobile');
    
    console.log('Found buttons:', { connectBtn: !!connectBtn, connectBtnMobile: !!connectBtnMobile });
    
    // Check if already replaced with dropdown
    const existingDropdowns = document.querySelectorAll('.wallet-dropdown-container');
    
    // Only update the desktop button (connectWallet)
    // Mobile button is handled separately and should remain hidden on desktop
    const btn = connectBtn;
    
    if (!btn && existingDropdowns.length === 0) {
        console.warn('Connect wallet button not found in DOM');
        return;
    }
    
    console.log('Updating wallet UI');
    
    if (userAccount) {
        // Skip if already replaced
        if (btn && btn.parentNode && btn.parentNode.className === 'wallet-dropdown-container') {
            console.log('Already showing dropdown, skipping');
            return;
        }
        
        // Connected - show address with dropdown menu
        // Format: 0x1234...5678 (first 6 chars + last 4 chars)
        const shortAddress = `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        
        // Create wallet dropdown container
        const walletContainer = document.createElement('div');
        walletContainer.className = 'wallet-dropdown-container';
        walletContainer.innerHTML = `
            <button class="wallet-connected-btn">
                <i class="fas fa-wallet"></i>
                <span class="wallet-address-text">${shortAddress}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="wallet-dropdown-menu">
                <div class="wallet-dropdown-item wallet-address-full">
                    <i class="fas fa-user-circle"></i>
                    <span>${userAccount}</span>
                </div>
                <div class="wallet-dropdown-divider"></div>
                <button class="wallet-dropdown-item wallet-disconnect-btn" onclick="disconnectWallet()">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Disconnect</span>
                </button>
            </div>
        `;
        
        // Replace button with dropdown container
        if (btn) {
            btn.parentNode.replaceChild(walletContainer, btn);
        }
        
        // Add click handler to toggle dropdown
        const dropdownBtn = walletContainer.querySelector('.wallet-connected-btn');
        const dropdownMenu = walletContainer.querySelector('.wallet-dropdown-menu');
        
        dropdownBtn.onclick = (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        };
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!walletContainer.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        console.log('Button set to connected mode with dropdown');
        
    } else {
        // Not connected - show connect button
        // If it's a dropdown container, replace it with button
        if (existingDropdowns.length > 0) {
            existingDropdowns.forEach(dropdown => {
                const newBtn = document.createElement('button');
                newBtn.className = 'connect-wallet-btn';
                newBtn.id = 'connectWallet';
                newBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    <span class="wallet-address-text">Connect Wallet</span>
                `;
                newBtn.onclick = () => {
                    console.log('Connect wallet button clicked!');
                    connectWallet();
                };
                dropdown.parentNode.replaceChild(newBtn, dropdown);
            });
        } else if (btn) {
            btn.innerHTML = `
                <i class="fas fa-wallet"></i>
                <span class="wallet-address-text">Connect Wallet</span>
            `;
            btn.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
            btn.disabled = false;
            btn.title = 'Click to connect wallet';
            btn.onclick = () => {
                console.log('Connect wallet button clicked!');
                connectWallet();
            };
        }
        console.log('Button set to connect mode');
    }
}

// Disconnect Wallet Function
async function disconnectWallet() {
    console.log('User disconnecting wallet');
    
    if (walletConnector) {
        await walletConnector.disconnect();
    }
    
    userAccount = null;
    web3 = null;
    authToken = null;
    localStorage.removeItem('cc_wallet_type');
    localStorage.removeItem('cc_auth_token');
    
    clearContractData();
    updateWalletUI();
    console.log('Wallet disconnected');
}

// Load Basic Token Info (doesn't require wallet connection)
async function loadBasicTokenInfo() {
    try {
        // Set default values - no backend needed
        document.getElementById('totalSupply').textContent = '13,370,000 CPC';
        console.log('Basic token info loaded');
    } catch (error) {
        console.error('Failed to load basic token info:', error);
    }
}

// Load Contract Data from Backend
async function loadContractData() {
    if (!userAccount) return;
    
    try {
        // Load all contract data in parallel
        await Promise.all([
            loadTokenInfo(),
            loadAirdropData(),
            loadPresaleData(),
            loadMiningData(),
            loadUserBalances()
        ]);
        
    } catch (error) {
        console.error('Failed to load contract data:', error);
    }
}

// Load Token Information
async function loadTokenInfo() {
    try {
        // Token info is static, no need to load from backend
        console.log('Token info already set');
    } catch (error) {
        console.error('Failed to load token info:', error);
    }
}

// Load Airdrop Data - Read directly from blockchain, no backend dependency
async function loadAirdropData() {
    if (!userAccount || !web3) {
        console.log('Wallet not connected, skipping airdrop data load');
        return;
    }

    try {
        // Create contract instances
        const airdropABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.AIRDROP) 
            ? CONTRACTS_ABI_FULL.AIRDROP 
            : CONTRACT_CONFIG.ABIS.AIRDROP;
        
        const airdropContract = new web3.eth.Contract(airdropABI, CONTRACTS.AIRDROP);
        
        // Read data directly from blockchain
        const [hasBABT, hasClaimed, totalClaimed, claimAmount] = await Promise.all([
            checkBABTStatus(userAccount),
            airdropContract.methods.hasClaimed(userAccount).call(),
            airdropContract.methods.totalClaimed().call(),
            airdropContract.methods.CLAIM_AMOUNT().call()
        ]);
        
        console.log('Airdrop data loaded:', { hasBABT, hasClaimed, totalClaimed, claimAmount });
        
        // Update BABT status
        const babtStatusElement = document.getElementById('babtStatus');
        if (hasBABT) {
            babtStatusElement.textContent = 'Verified ✓';
            babtStatusElement.style.color = '#2ecc71';
        } else {
            babtStatusElement.textContent = 'Not Eligible ✗';
            babtStatusElement.style.color = '#e74c3c';
        }
        
        // Update claim button - only BABT verification required
        const claimBtn = document.getElementById('claimAirdrop');
        if (hasBABT && !hasClaimed) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim Airdrop';
        } else if (hasClaimed) {
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<i class="fas fa-check"></i> Already Claimed';
        } else {
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim Airdrop';
        }
        
        // Update airdrop progress
        const airdropPool = 1337000; // Fixed airdrop pool size
        const totalClaimedCPC = parseFloat(totalClaimed) / Math.pow(10, 18);
        const percentage = (totalClaimedCPC / airdropPool) * 100;
        
        updateAirdropProgress(percentage);
        
    } catch (error) {
        console.error('Failed to load airdrop data:', error);
        // On error, show unknown status
        const babtStatusElement = document.getElementById('babtStatus');
        if (babtStatusElement) {
            babtStatusElement.textContent = 'Check Failed';
            babtStatusElement.style.color = '#f39c12';
        }
    }
}

// Check BABT Status directly from blockchain
async function checkBABTStatus(address) {
    try {
        if (!web3 || !address) {
            console.warn('Web3 or address not available');
            return false;
        }

        // Create BABT contract instance - use full ABI
        const babtABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.BABT) 
            ? CONTRACTS_ABI_FULL.BABT 
            : BABT_CONFIG.abi;
        const babtContract = new web3.eth.Contract(babtABI, BABT_CONFIG.address);
        console.log('BABT contract initialized with full ABI');
        
        // Query balance (this is a call, not a transaction - no gas cost)
        const balance = await babtContract.methods.balanceOf(address).call();
        
        console.log(`BABT balance for ${address}: ${balance}`);
        
        return BigInt(balance) > 0n;
        
    } catch (error) {
        console.error('Error checking BABT status:', error);
        // If check fails, return false (user can still try to claim, contract will verify)
        return false;
    }
}

// Update Airdrop Progress
function updateAirdropProgress(percentage) {
    const progressFill = document.getElementById('airdropProgress');
    const progressText = document.getElementById('airdropProgressText');
    const remaining = document.getElementById('airdropRemaining');
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage.toFixed(1)}% claimed`;
    
    const remainingAmount = Math.floor(1337000 * (100 - percentage) / 100);
    remaining.textContent = `${remainingAmount.toLocaleString()} CPC`;
}

// Load Presale Data directly from blockchain
async function loadPresaleData() {
    if (!userAccount || !web3) {
        console.log('Wallet not connected, skipping presale data load');
        return;
    }

    try {
        const presaleABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.PRESALE) 
            ? CONTRACTS_ABI_FULL.PRESALE 
            : CONTRACT_CONFIG.ABIS.PRESALE;
        
        const presaleContract = new web3.eth.Contract(presaleABI, CONTRACTS.PRESALE);
        
        // Read available data from blockchain
        const [tokensSold, hasNFT] = await Promise.all([
            presaleContract.methods.tokensSold().call(),
            presaleContract.methods.hasNFT(userAccount).call()
        ]);
        
        const tokensSoldCPC = parseFloat(tokensSold) / Math.pow(10, 18);
        
        // Calculate BNB raised from tokens sold (rate is 133.7 CPC per BNB)
        const bnbRaisedBNB = tokensSoldCPC / 133.7;
        
        // Display amounts
        document.getElementById('bnbRaised').textContent = `${bnbRaisedBNB.toLocaleString(undefined, {maximumFractionDigits: 2})} BNB`;
        document.getElementById('cpcSold').textContent = `${tokensSoldCPC.toLocaleString()} CPC`;
        
        const progressBar = document.getElementById('presaleProgressBar');
        const progress = (bnbRaisedBNB / 10000) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update user NFT status
        const nftStatus = document.getElementById('nftStatus');
        if (hasNFT) {
            nftStatus.textContent = 'Owned ✓';
            nftStatus.style.color = '#2ecc71';
            // Estimate user contribution (at least 1 BNB if they have NFT)
            document.getElementById('userBnb').textContent = '≥ 1 BNB';
        } else {
            nftStatus.textContent = 'Not Owned ✗';
            nftStatus.style.color = '#e74c3c';
            document.getElementById('userBnb').textContent = '0 BNB';
        }
        
        console.log('Presale data loaded successfully');
        
    } catch (error) {
        console.error('Failed to load presale data:', error);
    }
}

// Load Mining Data directly from blockchain
async function loadMiningData() {
    if (!userAccount || !web3) {
        console.log('Wallet not connected, skipping mining data load');
        return;
    }

    try {
        const miningABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.MINING) 
            ? CONTRACTS_ABI_FULL.MINING 
            : CONTRACT_CONFIG.ABIS.MINING;
        
        const miningContract = new web3.eth.Contract(miningABI, CONTRACTS.MINING);
        
        // Read available data from blockchain
        const [totalStaked, initRate, pool, userStakeAmount, userEarned, hasPaidTicket] = await Promise.all([
            miningContract.methods.totalStaked().call(),
            miningContract.methods.INIT_RATE().call(),
            miningContract.methods.POOL().call(),
            miningContract.methods.staked(userAccount).call(),
            miningContract.methods.earned(userAccount).call(),
            miningContract.methods.hasPaidTicket(userAccount).call()
        ]);
        
        const totalStakedCPC = parseFloat(totalStaked) / Math.pow(10, 18);
        const initRateCPC = parseFloat(initRate) / Math.pow(10, 18);
        const poolCPC = parseFloat(pool) / Math.pow(10, 18);
        
        // User stake data
        const userStakeCPC = parseFloat(userStakeAmount || '0') / Math.pow(10, 18);
        const userEarnedCPC = parseFloat(userEarned || '0') / Math.pow(10, 18);
        const userWeightNum = hasPaidTicket ? 2 : 1; // Weight is 2x if ticket paid, 1x otherwise
        
        // Calculate pool remaining (initial pool - total staked rewards)
        const poolRemainingCPC = poolCPC; // Simplified - actual remaining would need more calculation
        
        document.getElementById('totalStaked').textContent = `${totalStakedCPC.toLocaleString()} CPC`;
        document.getElementById('miningRate').textContent = `${initRateCPC} CPC/hour`;
        document.getElementById('poolRemaining').textContent = `${poolRemainingCPC.toLocaleString()} CPC`;
        
        document.getElementById('userStake').textContent = `${userStakeCPC.toLocaleString()} CPC`;
        document.getElementById('userWeight').textContent = `${userWeightNum}x`;
        document.getElementById('pendingRewards').textContent = `${userEarnedCPC.toLocaleString()} CPC`;
        
        // Update ticket status UI
        const ticketStatusElement = document.getElementById('ticketStatus');
        const activateBtn = document.getElementById('activateStaking');
        
        if (hasPaidTicket) {
            // User has paid ticket - show activated status
            ticketStatusElement.textContent = 'Activated ✓';
            ticketStatusElement.style.color = '#2ecc71';
            
            // Hide activate button
            if (activateBtn) {
                activateBtn.style.display = 'none';
            }
            
            // Enable stake buttons
            enableStakeButtons();
        } else {
            // User has not paid ticket - show not activated status
            ticketStatusElement.textContent = 'Not Activated ✗';
            ticketStatusElement.style.color = '#e74c3c';
            
            // Show activate button
            if (activateBtn) {
                activateBtn.style.display = 'inline-block';
                activateBtn.disabled = false;
            }
            
            // Disable stake buttons
            disableStakeButtons();
        }
        
        // Update halving progress
        const halvingProgress = document.getElementById('halvingProgress');
        halvingProgress.style.width = '0%'; // Simplified
        
        console.log('Mining data loaded successfully, ticket status:', hasPaidTicket);
        
        // Load NFT data
        await loadNFTData();
        
    } catch (error) {
        console.error('Failed to load mining data:', error);
    }
}

// Load NFT Data directly from blockchain
async function loadNFTData() {
    if (!userAccount || !web3) {
        return;
    }

    try {
        console.log('🔍 Loading NFT data for:', userAccount);
        
        // Get ABIs
        const presaleABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.PRESALE) 
            ? CONTRACTS_ABI_FULL.PRESALE 
            : CONTRACT_CONFIG.ABIS.PRESALE;
        
        const nftABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.REWARDNFT) 
            ? CONTRACTS_ABI_FULL.REWARDNFT 
            : CONTRACT_CONFIG.ABIS.REWARDNFT;
        
        // Create contract instances
        const presaleContract = new web3.eth.Contract(presaleABI, CONTRACTS.PRESALE);
        const nftContract = new web3.eth.Contract(nftABI, CONTRACTS.REWARDNFT);
        
        // Method 1: Check via Presale contract
        const hasNFTFromPresale = await presaleContract.methods.hasNFT(userAccount).call();
        console.log('📋 Presale hasNFT:', hasNFTFromPresale);
        
        // Method 2: Check NFT balance directly from NFT contract (more reliable)
        const nftBalance = await nftContract.methods.balanceOf(userAccount).call();
        const nftBalanceNum = parseInt(nftBalance);
        console.log('💎 NFT Balance:', nftBalanceNum);
        
        const nftEmptyState = document.getElementById('nftEmptyState');
        const nftCardMini = document.getElementById('nftCardMini');
        const nftCount = document.getElementById('nftCount');
        
        // User has NFT if either method confirms it
        const hasNFT = hasNFTFromPresale || nftBalanceNum > 0;
        
        if (hasNFT && nftBalanceNum > 0) {
            console.log('✅ User has NFT!');
            
            // User has NFT - show NFT card
            nftEmptyState.style.display = 'none';
            nftCardMini.style.display = 'flex';
            nftCount.textContent = nftBalanceNum.toString();
            
            // Get the actual token ID owned by the user
            let tokenId = '0';
            try {
                // Get the first token owned by the user
                tokenId = await nftContract.methods.tokenOfOwnerByIndex(userAccount, 0).call();
                console.log('🎫 Token ID:', tokenId);
            } catch (e) {
                console.warn('Could not fetch token ID:', e);
                // Fallback: try to get from events or use placeholder
                tokenId = '0';
            }
            
            // Set NFT image (using IPFS gateway)
            const nftImage = document.getElementById('nftImage');
            nftImage.src = 'https://ipfs.io/ipfs/bafybeibaw5ich25wqbpu6vjmzmlfjfl6egbnfbdnf52zevsx44kxnvtwzq';
            nftImage.onerror = function() {
                // Fallback to placeholder if IPFS fails
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJlY2M3MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjYwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5DUEMtTkZUPC90ZXh0Pjwvc3ZnPg==';
            };
            
            // Update NFT info
            document.getElementById('nftTokenId').textContent = `#${tokenId}`;
            document.getElementById('nftName').textContent = `CPC-NFT #${tokenId}`;
            
            // Update status
            document.getElementById('nftActiveStatus').textContent = 'Active';
            
        } else {
            console.log('❌ User does not have NFT');
            
            // User doesn't have NFT - show empty state
            nftEmptyState.style.display = 'flex';
            nftCardMini.style.display = 'none';
            nftCount.textContent = '0';
        }
        
    } catch (error) {
        console.error('❌ Failed to load NFT data:', error);
        // Show empty state on error
        document.getElementById('nftEmptyState').style.display = 'flex';
        document.getElementById('nftCardMini').style.display = 'none';
        document.getElementById('nftCount').textContent = '0';
    }
}

// Load User Balances from Backend
async function loadUserBalances() {
    if (!userAccount || !web3) {
        return;
    }

    try {
        const tokenABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.CPCTOKEN) 
            ? CONTRACTS_ABI_FULL.CPCTOKEN 
            : CONTRACT_CONFIG.ABIS.CPCTOKEN;
        
        const tokenContract = new web3.eth.Contract(tokenABI, CONTRACTS.CPCTOKEN);
        const balance = await tokenContract.methods.balanceOf(userAccount).call();
        const ccBalance = parseFloat(balance) / Math.pow(10, 18);
        
        // Update balance displays throughout the app
        updateBalanceDisplays(ccBalance);
        
    } catch (error) {
        console.error('Failed to load user balances:', error);
    }
}

// Update Balance Displays
function updateBalanceDisplays(balance) {
    // Update any balance displays in the UI
    console.log(`User CPC Balance: ${balance} CPC`);
}



// Clear Contract Data from UI
function clearContractData() {
    // Clear user-specific data only, keep public token info like totalSupply
    const elementsToReset = [
        'bnbRaised', 'cpcSold', 'userBnb', 'nftStatus',
        'totalStaked', 'miningRate', 'poolRemaining',
        'userStake', 'userWeight', 'pendingRewards'
    ];
    
    elementsToReset.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '-';
        }
    });
    
    // Reset BABT status to "Connect Wallet"
    const babtStatusElement = document.getElementById('babtStatus');
    if (babtStatusElement) {
        babtStatusElement.textContent = 'Connect Wallet';
        babtStatusElement.style.color = '#95a5a6';
    }
    
    // Reset progress bars
    const progressBars = ['airdropProgress', 'presaleProgressBar', 'halvingProgress'];
    progressBars.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.width = '0%';
        }
    });
    
    console.log('Contract data cleared');
}

// Claim Airdrop
async function claimAirdrop() {
    // Only check wallet connection, no backend auth needed
    if (!userAccount) {
        console.log('Please connect your wallet first');
        return;
    }
    
    // Ensure on BSC network
    try {
        const chainId = await web3.eth.getChainId();
        if (chainId !== 56) {
            console.log('Please switch to BSC Mainnet (Chain ID: 56)');
            await ensureBSCNetwork();
            return;
        }
    } catch (error) {
        console.error('Network check error:', error);
        console.log('Please ensure you are connected to BSC Mainnet');
        return;
    }
    
    // Check BABT verification status only
    const babtStatus = document.getElementById('babtStatus');
    
    if (!babtStatus.textContent.includes('✓')) {
        console.log('Please verify your BABT NFT first. Only BABT holders can claim CPC airdrop.');
        return;
    }
    
    const claimBtn = document.getElementById('claimAirdrop');
    
    try {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        
        // Check if user has already claimed
        // Use complete JSON ABI instead of simplified string format
        const airdropABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.AIRDROP) 
            ? CONTRACTS_ABI_FULL.AIRDROP 
            : CONTRACT_CONFIG.ABIS.AIRDROP;
        
        const airdropContract = new web3.eth.Contract(
            airdropABI,
            CONTRACTS.AIRDROP
        );
        
        console.log('Airdrop contract initialized:', CONTRACTS.AIRDROP);
        console.log('Using full JSON ABI with', airdropABI.length, 'methods');
        
        const hasClaimed = await airdropContract.methods.hasClaimed(userAccount).call();
        
        if (hasClaimed) {
            console.log('You have already claimed your CPC airdrop. Each BABT holder can only claim once.');
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<i class="fas fa-check"></i> Already Claimed';
            return;
        }
        
        claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';
        
        // Call the claim function - let wallet estimate gas
        const tx = await airdropContract.methods.claim().send({
            from: userAccount
        });
        
        console.log('Airdrop claim transaction:', tx);
        
        console.log('Airdrop claimed successfully! 1 CPC has been added to your wallet.');
        
        // Update button
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-check"></i> Already Claimed';
        
        // Reload data
        await loadContractData();
        
    } catch (error) {
        console.error('Failed to claim airdrop:', error);
        
        // User-friendly error messages
        let errorMessage = 'Failed to claim airdrop';
        
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled';
        } else if (error.message.includes('Already claimed')) {
            errorMessage = 'You have already claimed this airdrop';
            claimBtn.disabled = true;
            claimBtn.innerHTML = '<i class="fas fa-check"></i> Already Claimed';
        } else if (error.message.includes('Not eligible')) {
            errorMessage = 'You are not eligible for this airdrop. BABT NFT required.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.code !== 4001) {
            console.error(errorMessage);
        }
        
        // Reset button if not already claimed
        if (!error.message.includes('Already claimed')) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim Airdrop';
        }
    }
}

// Activate Staking (Pay 2 USDT ticket)
async function activateStaking() {
    if (!userAccount) {
        console.log('Please connect your wallet first');
        return;
    }
    
    const activateBtn = document.getElementById('activateStaking');
    
    try {
        activateBtn.disabled = true;
        activateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activating...';
        
        // USDT contract address on BSC
        const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
        const TICKET_FEE = web3.utils.toWei('2', 'ether'); // 2 USDT
        
        // Create USDT contract instance
        const usdtABI = [
            {
                "constant": false,
                "inputs": [
                    {"name": "spender", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {"name": "owner", "type": "address"},
                    {"name": "spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            }
        ];
        
        const usdtContract = new web3.eth.Contract(usdtABI, USDT_ADDRESS);
        
        // Check current allowance
        const currentAllowance = await usdtContract.methods.allowance(userAccount, CONTRACTS.MINING).call();
        console.log('Current USDT allowance:', web3.utils.fromWei(currentAllowance, 'ether'));
        
        // If allowance is insufficient, approve first
        if (BigInt(currentAllowance) < BigInt(TICKET_FEE)) {
            activateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving USDT...';
            console.log('Approving USDT for Mining contract...');
            
            const approveTx = await usdtContract.methods.approve(
                CONTRACTS.MINING,
                TICKET_FEE
            ).send({
                from: userAccount
            });
            
            console.log('USDT approved:', approveTx);
        }
        
        // Now pay the ticket
        activateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Paying ticket...';
        
        // Create Mining contract instance
        const miningABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.MINING) 
            ? CONTRACTS_ABI_FULL.MINING 
            : CONTRACT_CONFIG.ABIS.MINING;
        
        const miningContract = new web3.eth.Contract(miningABI, CONTRACTS.MINING);
        console.log('Mining contract initialized for payTicket');
        
        // Call payTicket function
        const tx = await miningContract.methods.payTicket().send({
            from: userAccount
        });
        
        console.log('Ticket payment transaction:', tx);
        
        console.log('Staking activated successfully! You can now stake your CPC tokens.');
        
        // Update UI to show activated status
        document.getElementById('ticketStatus').textContent = 'Activated';
        document.getElementById('ticketStatus').style.color = '#2ecc71';
        
        // Enable stake amount buttons
        enableStakeButtons();
        
        // Hide activate button
        activateBtn.style.display = 'none';
        
        // Reload data
        await loadContractData();
        
    } catch (error) {
        console.error('Failed to activate staking:', error);
        
        let errorMessage = 'Failed to activate staking';
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.code !== 4001) {
            console.error(errorMessage);
        }
        
        activateBtn.disabled = false;
        activateBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Activate Staking (2 USDT)';
    }
}

// Claim Mining Rewards
async function claimMiningRewards() {
    if (!userAccount) {
        console.log('Please connect your wallet first');
        return;
    }
    
    const claimBtn = document.getElementById('claimRewards');
    
    try {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';
        
        // Create Mining contract instance
        const miningABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.MINING) 
            ? CONTRACTS_ABI_FULL.MINING 
            : CONTRACT_CONFIG.ABIS.MINING;
        
        const miningContract = new web3.eth.Contract(miningABI, CONTRACTS.MINING);
        
        // Call claimReward function - let wallet estimate gas
        const tx = await miningContract.methods.claimReward().send({
            from: userAccount
        });
        
        console.log('Mining reward claim transaction:', tx);
        
        console.log('Mining rewards claimed successfully!');
        
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-coins"></i> Claim Mining Rewards';
        
        await loadMiningData();
        
    } catch (error) {
        console.error('Failed to claim mining rewards:', error);
        
        let errorMessage = 'Failed to claim mining rewards';
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.code !== 4001) {
            console.error(errorMessage);
        }
        
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-coins"></i> Claim Mining Rewards';
    }
}

// Claim NFT Rewards
async function claimNFTRewards() {
    if (!userAccount) {
        console.log('Please connect your wallet first');
        return;
    }
    
    const claimBtn = document.getElementById('claimNftRewards');
    
    try {
        claimBtn.disabled = true;
        claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';
        
        // Create Mining contract instance
        const miningABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.MINING) 
            ? CONTRACTS_ABI_FULL.MINING 
            : CONTRACT_CONFIG.ABIS.MINING;
        
        const miningContract = new web3.eth.Contract(miningABI, CONTRACTS.MINING);
        
        // Call claimNftReward function - let wallet estimate gas
        const tx = await miningContract.methods.claimNftReward().send({
            from: userAccount
        });
        
        console.log('NFT reward claim transaction:', tx);
        
        console.log('NFT rewards claimed successfully! 1 CPC added to your wallet.');
        
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-medal"></i> Claim NFT Rewards';
        
        await loadMiningData();
        
    } catch (error) {
        console.error('Failed to claim NFT rewards:', error);
        
        let errorMessage = 'Failed to claim NFT rewards';
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.code !== 4001) {
            console.error(errorMessage);
        }
        
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-medal"></i> Claim NFT Rewards';
    }
}

// Contract Interaction Authorization - Each contract operation requires user signature
async function requestContractInteractionAuth(operation) {
    try {
        if (!userAccount || !authToken) {
            throw new Error('Please connect and authenticate wallet first');
        }
        
        console.log(`Requesting contract interaction authorization: ${operation}`);
        
        // Generate operation-specific message
        const timestamp = Date.now();
        const message = `Authorize Common Prosperity DApp to execute operation: ${operation}\n\nWallet Address: ${userAccount}\nTimestamp: ${new Date(timestamp).toISOString()}\n\nPlease confirm you want to execute this operation.`;
        
        // Request user signature authorization
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, userAccount]
        });
        
        console.log(`Contract interaction authorization successful: ${operation}`);
        return { signature, message, timestamp };
        
    } catch (error) {
        console.error(`Contract interaction authorization failed: ${error.message}`);
        if (error.code === 4001) {
            throw new Error('User rejected operation authorization');
        }
        throw new Error(`Authorization failed: ${error.message}`);
    }
}

// Simulate Transaction (for demo purposes)
async function simulateTransaction(operation = 'Contract Interaction') {
    // Each contract interaction requires user signature authorization
    await requestContractInteractionAuth(operation);
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 2000); // Simulate 2 second transaction time
    });
}

// Smooth Scrolling for Navigation
function smoothScroll(target) {
    document.querySelector(target).scrollIntoView({
        behavior: 'smooth'
    });
}

// Update Active Navigation Link
function updateActiveNav() {
    const sections = document.querySelectorAll('.section, .hero');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Toggle Rules Function
function toggleRules(section) {
    console.log('toggleRules called for:', section);
    const rulesContent = document.getElementById(`${section}-rules`);
    const toggleBtn = document.getElementById(`${section}-toggle`);
    
    console.log('rulesContent:', rulesContent);
    console.log('toggleBtn:', toggleBtn);
    
    if (rulesContent && toggleBtn) {
        const isCollapsed = rulesContent.classList.contains('collapsed');
        console.log('isCollapsed:', isCollapsed);
        
        if (isCollapsed) {
            rulesContent.classList.remove('collapsed');
            toggleBtn.classList.add('rotated');
            console.log('Expanded');
        } else {
            rulesContent.classList.add('collapsed');
            toggleBtn.classList.remove('rotated');
            console.log('Collapsed');
        }
    } else {
        console.error('Elements not found!');
    }
}

// Copy Address Function
function copyAddress(address) {
    // Use modern clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(() => {
            showCopySuccess();
            console.log('Address copied:', address);
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
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> Address copied to clipboard!';
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
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
        document.body.removeChild(textarea);
        showCopySuccess();
        console.log('Address copied:', address);
    } catch (err) {
        document.body.removeChild(textarea);
        console.error('Failed to copy:', err);
        alert('Failed to copy address. Please copy manually:\n' + address);
    }
    
    // Remove temporary textarea
    document.body.removeChild(textarea);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing...');
    
    // Wait for Web3 library to load, then initialize
    const checkWeb3AndInit = () => {
        if (typeof Web3 !== 'undefined') {
            console.log('Web3 library loaded successfully');
            initWeb3();
        } else {
            console.log('Waiting for Web3 library...');
            setTimeout(checkWeb3AndInit, 100);
        }
    };
    
    checkWeb3AndInit();
    
    // Wallet Modal Event Listeners
    const walletModal = document.getElementById('walletModal');
    const closeWalletModal = document.getElementById('closeWalletModal');
    const walletOptions = document.querySelectorAll('.wallet-option');
    
    // Close modal when clicking close button
    if (closeWalletModal) {
        closeWalletModal.addEventListener('click', hideWalletModal);
    }
    
    // Close modal when clicking outside
    if (walletModal) {
        walletModal.addEventListener('click', function(e) {
            if (e.target === walletModal) {
                hideWalletModal();
            }
        });
    }
    
    // Connect Wallet button click handlers
    const connectWalletBtn = document.getElementById('connectWallet');
    const connectWalletMobileBtn = document.getElementById('connectWalletMobile');
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', showWalletModal);
    }
    
    if (connectWalletMobileBtn) {
        connectWalletMobileBtn.addEventListener('click', showWalletModal);
    }
    
    // Wallet option click handlers
    walletOptions.forEach(option => {
        option.addEventListener('click', function() {
            const walletType = this.getAttribute('data-wallet');
            if (!this.classList.contains('disabled')) {
                connectWallet(walletType);
            }
        });
    });
    
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('hidden');
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('hidden')) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            } else {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        });
        
        // Close menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navMenu.classList.add('hidden');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
    
    // Initialize rules as collapsed and add event listeners
    const headers = document.querySelectorAll('.rules-header-inline');
    console.log('Found rules headers:', headers.length);
    
    headers.forEach(header => {
        const section = header.getAttribute('data-section');
        console.log('Setting up header for section:', section);
        
        if (section) {
            // Add click event listener to the entire header
            header.style.cursor = 'pointer';
            header.addEventListener('click', function(e) {
                console.log('Header clicked for section:', section);
                toggleRules(section);
            });
            
            // Initialize as collapsed
            const rulesContent = document.getElementById(`${section}-rules`);
            if (rulesContent) {
                rulesContent.classList.add('collapsed');
                console.log('Initialized', section, 'as collapsed');
            }
        }
    });
    
    // Connect Wallet Button - dynamically set in updateWalletUI()
    
    // Airdrop Claim Button
    document.getElementById('claimAirdrop').addEventListener('click', claimAirdrop);
    
    // Mining Activate Staking Button
    document.getElementById('activateStaking').addEventListener('click', activateStaking);
    
    // Mining Rewards Buttons
    document.getElementById('claimRewards').addEventListener('click', claimMiningRewards);
    document.getElementById('claimNftRewards').addEventListener('click', claimNFTRewards);
    
    // Navigation Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            smoothScroll(target);
        });
    });
    
    // Hero Buttons - Now used for external navigation (OTC/Voting)
    // Removed smooth scroll listeners as buttons now navigate to external pages
    
    // Scroll Event for Navigation
    window.addEventListener('scroll', updateActiveNav);
    
    // Load initial data every 30 seconds
    setInterval(() => {
        if (userAccount) {
            loadContractData();
        }
    }, 30000);
    
    // Amount Button Selection Logic - inside DOMContentLoaded
    let selectedBnbAmount = null;
    let selectedStakeAmount = null;

    // Handle BNB amount button clicks
    document.querySelectorAll('.amount-btn[data-type="bnb"]').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selected class from all BNB buttons
            document.querySelectorAll('.amount-btn[data-type="bnb"]').forEach(b => b.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Store selected amount
            selectedBnbAmount = parseFloat(this.dataset.amount);
            
            // Trigger purchase
            buyTokensWithAmount(selectedBnbAmount);
        });
    });

    // Handle Stake amount button clicks
    document.querySelectorAll('.amount-btn[data-type="stake"]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            
            // Remove selected class from all stake buttons
            document.querySelectorAll('.amount-btn[data-type="stake"]').forEach(b => b.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Store selected amount
            selectedStakeAmount = parseFloat(this.dataset.amount);
            
            // Trigger stake
            stakeTokensWithAmount(selectedStakeAmount);
        });
    });
});

// Ethereum events handled in setupWalletEventListeners()

// Modified buy function to use selected amount
async function buyTokensWithAmount(amount) {
    if (!userAccount) {
        console.log('Please connect your wallet first');
        return;
    }
    
    if (!amount || amount < 1) {
        console.log('Minimum purchase is 1 BNB');
        return;
    }
    
    const selectedBtn = document.querySelector('.amount-btn[data-type="bnb"].selected');
    
    try {
        if (selectedBtn) {
            selectedBtn.disabled = true;
            selectedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="amount-value">Processing...</span>';
        }
        
        // Create Presale contract instance
        const presaleABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.PRESALE) 
            ? CONTRACTS_ABI_FULL.PRESALE 
            : CONTRACT_CONFIG.ABIS.PRESALE;
        
        const presaleContract = new web3.eth.Contract(presaleABI, CONTRACTS.PRESALE);
        
        // Convert BNB amount to wei
        const amountWei = web3.utils.toWei(amount.toString(), 'ether');
        
        console.log('Buying CPC with', amount, 'BNB...');
        
        // Estimate gas before transaction
        try {
            const gasEstimate = await presaleContract.methods.buy().estimateGas({
                from: userAccount,
                value: amountWei
            });
            const gasCost = estimateTransactionCost(gasEstimate);
            if (gasCost) {
                console.log(`⛽ Estimated gas: ${gasEstimate} units (~${gasCost.toFixed(6)} BNB or $${(gasCost * 600).toFixed(2)})`);
            }
        } catch (estimateError) {
            console.warn('Could not estimate gas:', estimateError.message);
        }
        
        // Call buy function with BNB value - let wallet estimate gas
        const tx = await presaleContract.methods.buy().send({
            from: userAccount,
            value: amountWei
        });
        
        console.log('Purchase transaction:', tx);
        
        const cpcAmount = amount * 133.7;
        console.log(`Successfully purchased ${cpcAmount} CPC tokens for ${amount} BNB!`);
        
        // Reset selection
        if (selectedBtn) {
            selectedBtn.classList.remove('selected');
            selectedBtn.disabled = false;
            selectedBtn.innerHTML = `<span class="amount-value">${amount} BNB</span><span class="amount-receive">= ${cpcAmount.toLocaleString()} CPC</span>`;
        }
        selectedBnbAmount = null;
        
        // Reload data
        await loadPresaleData();
        
    } catch (error) {
        console.error('Purchase error:', error);
        
        let errorMessage = 'Failed to purchase tokens';
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.code !== 4001) {
            console.error(errorMessage);
        }
        
        if (selectedBtn) {
            selectedBtn.classList.remove('selected');
            selectedBtn.disabled = false;
            const cpcAmount = amount * 133.7;
            selectedBtn.innerHTML = `<span class="amount-value">${amount} BNB</span><span class="amount-receive">= ${cpcAmount.toLocaleString()} CPC</span>`;
        }
        selectedBnbAmount = null;
    }
}

// Modified stake function to use selected amount
async function stakeTokensWithAmount(amount) {
    if (!userAccount) {
        console.log('Please connect your wallet first');
        return;
    }
    
    if (!amount || amount < 10) {
        console.log('Minimum stake amount is 10 CPC');
        return;
    }
    
    const selectedBtn = document.querySelector('.amount-btn[data-type="stake"].selected');
    
    try {
        if (selectedBtn) {
            selectedBtn.disabled = true;
            selectedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="amount-value">Staking...</span>';
        }
        
        // Create contract instances
        const miningABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.MINING) 
            ? CONTRACTS_ABI_FULL.MINING 
            : CONTRACT_CONFIG.ABIS.MINING;
        
        const tokenABI = (typeof CONTRACTS_ABI_FULL !== 'undefined' && CONTRACTS_ABI_FULL.CPCTOKEN) 
            ? CONTRACTS_ABI_FULL.CPCTOKEN 
            : CONTRACT_CONFIG.ABIS.ERC20;
        
        const miningContract = new web3.eth.Contract(miningABI, CONTRACTS.MINING);
        const tokenContract = new web3.eth.Contract(tokenABI, CONTRACTS.CPCTOKEN);
        
        // Convert amount to wei
        const amountWei = web3.utils.toWei(amount.toString(), 'ether');
        
        // First approve the mining contract to spend tokens
        console.log('Approving mining contract to spend', amount, 'CPC...');
        const approveTx = await tokenContract.methods.approve(CONTRACTS.MINING, amountWei).send({
            from: userAccount
        });
        console.log('Approval transaction:', approveTx);
        
        // Then stake the tokens
        console.log('Staking', amount, 'CPC...');
        const stakeTx = await miningContract.methods.stake(amountWei).send({
            from: userAccount
        });
        console.log('Stake transaction:', stakeTx);
        
        console.log(`Successfully staked ${amount} CPC tokens for 10 years!`);
        
        // Reset selection
        if (selectedBtn) {
            selectedBtn.classList.remove('selected');
            selectedBtn.disabled = false;
            selectedBtn.innerHTML = `<span class="amount-value">${amount.toLocaleString()} CPC</span><span class="amount-apy">~175% APY*</span>`;
        }
        selectedStakeAmount = null;
        
        // Reload data
        await loadMiningData();
        
    } catch (error) {
        console.error('Staking error:', error);
        
        let errorMessage = 'Failed to stake tokens';
        if (error.code === 4001) {
            errorMessage = 'Transaction cancelled';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        if (error.code !== 4001) {
            console.error(errorMessage);
        }
        
        if (selectedBtn) {
            selectedBtn.classList.remove('selected');
            selectedBtn.disabled = false;
            selectedBtn.innerHTML = `<span class="amount-value">${amount.toLocaleString()} CPC</span><span class="amount-apy">~175% APY*</span>`;
        }
        selectedStakeAmount = null;
    }
}

// Enable stake buttons when ticket is activated
function enableStakeButtons() {
    document.querySelectorAll('.stake-amount-btn').forEach(btn => {
        btn.disabled = false;
    });
}

// Call this when ticket is activated
// Add to activateStaking function after success


// Whitepaper Viewer Functions
function viewWhitepaper(language) {
    const filename = language === 'en' ? 'WHITEPAPER_EN.md' : 'WHITEPAPER_CN.md';
    const title = language === 'en' ? 'CPC Whitepaper (English)' : 'CPC Whitepaper (Chinese)';
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #16213e;
        border-radius: 10px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px 30px;
        background: linear-gradient(45deg, #2ecc71, #27ae60);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <h2 style="margin: 0; font-size: 24px;">
            <i class="fas fa-book"></i> ${title}
        </h2>
        <button onclick="closeWhitepaperModal()" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.id = 'whitepaperContent';
    contentArea.style.cssText = `
        padding: 30px;
        overflow-y: auto;
        flex: 1;
        color: #ecf0f1;
        line-height: 1.8;
    `;
    contentArea.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';
    
    // Create footer with download button
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 20px 30px;
        background: #0f3460;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    `;
    footer.innerHTML = `
        <a href="${filename}" download="CPC_Whitepaper_${language.toUpperCase()}.md" style="
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        ">
            <i class="fas fa-download"></i> Download
        </a>
        <button onclick="closeWhitepaperModal()" style="
            background: #95a5a6;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
        ">
            Close
        </button>
    `;
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    modal.id = 'whitepaperModal';
    
    // Add to page
    document.body.appendChild(modal);
    
    // Load whitepaper content
    fetch(filename)
        .then(response => response.text())
        .then(markdown => {
            // Simple markdown to HTML conversion
            let html = markdown
                .replace(/^# (.*$)/gim, '<h1 style="color: #2ecc71; margin-top: 30px;">$1</h1>')
                .replace(/^## (.*$)/gim, '<h2 style="color: #3498db; margin-top: 25px;">$1</h2>')
                .replace(/^### (.*$)/gim, '<h3 style="color: #e67e22; margin-top: 20px;">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2ecc71;">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.*$)/gim, '<li style="margin-left: 20px;">$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            contentArea.innerHTML = '<div style="font-size: 16px;">' + html + '</div>';
        })
        .catch(error => {
            contentArea.innerHTML = `
                <p style="color: #e74c3c; text-align: center;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Failed to load whitepaper: ${error.message}
                </p>
            `;
        });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWhitepaperModal();
        }
    });
}

function closeWhitepaperModal() {
    const modal = document.getElementById('whitepaperModal');
    if (modal) {
        modal.remove();
    }
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWhitepaperModal();
    }
});
