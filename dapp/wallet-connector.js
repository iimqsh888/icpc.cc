// Multi-Wallet Connector for MetaMask, Binance Wallet, and WalletConnect
// WalletConnect Project ID
const WALLETCONNECT_PROJECT_ID = '53f0e240c9839fec1951c3ac3a888030';

// Wallet types
const WALLET_TYPES = {
    METAMASK: 'metamask',
    BINANCE: 'binance',
    WALLETCONNECT: 'walletconnect'
};

class WalletConnector {
    constructor() {
        this.provider = null;
        this.web3 = null;
        this.walletType = null;
        this.wcProvider = null;
    }

    // Detect available wallets
    detectWallets() {
        const wallets = [];
        
        // Check for MetaMask
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask && !window.ethereum.isBinance) {
            wallets.push(WALLET_TYPES.METAMASK);
        }
        
        // Check for Binance Wallet (desktop or mobile)
        if (typeof window.BinanceChain !== 'undefined' || 
            (typeof window.ethereum !== 'undefined' && window.ethereum.isBinance)) {
            wallets.push(WALLET_TYPES.BINANCE);
        }
        
        // WalletConnect is always available
        wallets.push(WALLET_TYPES.WALLETCONNECT);
        
        return wallets;
    }

    // Connect to MetaMask
    async connectMetaMask() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask not installed');
            }

            this.provider = window.ethereum;
            this.web3 = new Web3(this.provider);
            this.walletType = WALLET_TYPES.METAMASK;

            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });

            console.log('✅ MetaMask connected:', accounts[0]);
            return accounts[0];
        } catch (error) {
            console.error('MetaMask connection error:', error);
            throw error;
        }
    }

    // Connect to Binance Wallet
    async connectBinance() {
        try {
            console.log('🔍 Attempting to connect Binance Wallet...');
            console.log('BinanceChain available:', typeof window.BinanceChain !== 'undefined');
            console.log('ethereum available:', typeof window.ethereum !== 'undefined');
            if (typeof window.ethereum !== 'undefined') {
                console.log('ethereum.isBinance:', window.ethereum.isBinance);
                console.log('ethereum.isBinanceChain:', window.ethereum.isBinanceChain);
            }
            
            // Priority 1: Check for Binance Chain Wallet (desktop extension)
            if (typeof window.BinanceChain !== 'undefined') {
                console.log('✅ Using BinanceChain provider');
                this.provider = window.BinanceChain;
                this.web3 = new Web3(this.provider);
                this.walletType = WALLET_TYPES.BINANCE;

                const accounts = await this.provider.request({
                    method: 'eth_requestAccounts'
                });

                console.log('✅ Binance Wallet connected:', accounts[0]);
                return accounts[0];
            }
            
            // Priority 2: Check for Binance mobile app or injected provider
            if (typeof window.ethereum !== 'undefined') {
                const isBinance = window.ethereum.isBinance === true || 
                                 window.ethereum.isBinanceChain === true;
                
                console.log('Checking ethereum provider, isBinance:', isBinance);
                
                if (isBinance) {
                    console.log('✅ Using ethereum provider (Binance)');
                    this.provider = window.ethereum;
                    this.web3 = new Web3(this.provider);
                    this.walletType = WALLET_TYPES.BINANCE;

                    const accounts = await this.provider.request({
                        method: 'eth_requestAccounts'
                    });

                    console.log('✅ Binance Wallet connected:', accounts[0]);
                    return accounts[0];
                }
            }
            
            // Priority 3: If on mobile and no provider found, try deep link
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                console.log('📱 Mobile device detected, trying deep link...');
                alert('Opening Binance Wallet app. If you don\'t have it installed, please download it from your app store.');
                
                const dappUrl = encodeURIComponent(window.location.href);
                const binanceDeepLink = `bnc://app.binance.com/cedefi/browser?url=${dappUrl}`;
                
                // Try deep link
                window.location.href = binanceDeepLink;
                
                // Fallback to web3 wallet page after 2 seconds
                setTimeout(() => {
                    window.open(`https://www.binance.com/en/web3wallet`, '_blank');
                }, 2000);
                
                throw new Error('Please connect using Binance Wallet app');
            }
            
            throw new Error('Binance Wallet not detected. Please install Binance Chain Wallet extension or use Binance mobile app.');
        } catch (error) {
            console.error('❌ Binance Wallet connection error:', error);
            throw error;
        }
    }

    // Connect to WalletConnect
    async connectWalletConnect() {
        try {
            console.log('🔍 Initializing WalletConnect...');
            
            // Check if WalletConnect library is loaded
            if (typeof window.WalletConnectProvider === 'undefined') {
                throw new Error('WalletConnect library not loaded. Please refresh the page.');
            }
            
            // Get WalletConnect provider class
            const WalletConnectProvider = window.WalletConnectProvider.default || window.WalletConnectProvider;
            
            if (!WalletConnectProvider) {
                throw new Error('WalletConnect provider not available');
            }

            console.log('✅ WalletConnect library loaded');

            this.wcProvider = new WalletConnectProvider({
                rpc: {
                    56: 'https://bsc-dataseed.binance.org/',
                    97: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
                },
                chainId: 56,
                qrcode: true,
                qrcodeModalOptions: {
                    mobileLinks: [
                        'metamask',
                        'trust',
                        'rainbow',
                        'argent',
                        'imtoken',
                        'pillar',
                    ],
                }
            });

            console.log('📱 Opening WalletConnect QR modal...');
            
            // Enable session (triggers QR Code modal)
            await this.wcProvider.enable();

            this.provider = this.wcProvider;
            this.web3 = new Web3(this.provider);
            this.walletType = WALLET_TYPES.WALLETCONNECT;

            const accounts = await this.web3.eth.getAccounts();
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in WalletConnect session');
            }
            
            console.log('✅ WalletConnect connected:', accounts[0]);
            
            // Setup WalletConnect event listeners
            this.setupWalletConnectListeners();
            
            return accounts[0];
        } catch (error) {
            console.error('❌ WalletConnect connection error:', error);
            
            // Clean up on error
            if (this.wcProvider) {
                try {
                    await this.wcProvider.disconnect();
                } catch (e) {
                    console.error('Error disconnecting WalletConnect:', e);
                }
                this.wcProvider = null;
            }
            
            throw error;
        }
    }

    // Setup WalletConnect specific event listeners
    setupWalletConnectListeners() {
        if (!this.wcProvider) return;

        // Subscribe to accounts change
        this.wcProvider.on('accountsChanged', (accounts) => {
            console.log('WalletConnect accounts changed:', accounts);
            if (window.handleAccountsChanged) {
                window.handleAccountsChanged(accounts);
            }
        });

        // Subscribe to chainId change
        this.wcProvider.on('chainChanged', (chainId) => {
            console.log('WalletConnect chain changed:', chainId);
            if (window.handleChainChanged) {
                window.handleChainChanged(chainId);
            }
        });

        // Subscribe to session disconnection
        this.wcProvider.on('disconnect', (code, reason) => {
            console.log('WalletConnect disconnected:', code, reason);
            if (window.handleDisconnect) {
                window.handleDisconnect();
            }
        });
    }

    // Generic connect method with wallet selection
    async connect(walletType) {
        // Normalize wallet type to lowercase
        const normalizedType = walletType ? walletType.toLowerCase() : null;
        
        switch (normalizedType) {
            case 'metamask':
            case WALLET_TYPES.METAMASK:
                return await this.connectMetaMask();
            case 'binance':
            case WALLET_TYPES.BINANCE:
                return await this.connectBinance();
            case 'walletconnect':
            case WALLET_TYPES.WALLETCONNECT:
                return await this.connectWalletConnect();
            default:
                throw new Error(`Unknown wallet type: ${walletType}`);
        }
    }

    // Disconnect wallet
    async disconnect() {
        if (this.wcProvider) {
            await this.wcProvider.disconnect();
        }
        
        this.provider = null;
        this.web3 = null;
        this.walletType = null;
        this.wcProvider = null;
        
        console.log('✅ Wallet disconnected');
    }

    // Get current account
    async getAccount() {
        if (!this.web3) return null;
        const accounts = await this.web3.eth.getAccounts();
        return accounts[0] || null;
    }

    // Get chain ID
    async getChainId() {
        if (!this.web3) return null;
        return await this.web3.eth.getChainId();
    }

    // Switch to BSC network
    async switchToBSC() {
        if (!this.provider) {
            throw new Error('No wallet connected');
        }

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

        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BSC_CONFIG.chainId }]
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to the wallet
            if (switchError.code === 4902) {
                try {
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [BSC_CONFIG]
                    });
                } catch (addError) {
                    throw addError;
                }
            } else {
                throw switchError;
            }
        }
    }

    // Sign message - unified approach for all wallets
    async signMessage(message, account) {
        if (!this.provider) {
            throw new Error('No wallet connected');
        }

        try {
            // Use web3.eth.personal.sign for all wallets (WalletConnect compatible)
            if (this.web3) {
                return await this.web3.eth.personal.sign(message, account, '');
            }
            
            // Fallback to provider.request if web3 not available
            return await this.provider.request({
                method: 'personal_sign',
                params: [message, account]
            });
        } catch (error) {
            console.error('Sign message error:', error);
            throw error;
        }
    }

    // Setup event listeners for wallet changes
    setupEventListeners(callbacks = {}) {
        if (!this.provider) return;

        // For MetaMask and Binance Wallet
        if (this.walletType !== WALLET_TYPES.WALLETCONNECT) {
            if (callbacks.onAccountsChanged) {
                this.provider.on('accountsChanged', callbacks.onAccountsChanged);
            }

            if (callbacks.onChainChanged) {
                this.provider.on('chainChanged', callbacks.onChainChanged);
            }

            if (callbacks.onDisconnect) {
                this.provider.on('disconnect', callbacks.onDisconnect);
            }
        }
        // WalletConnect listeners are set up in setupWalletConnectListeners
    }
}

// Export for use in other scripts
window.WalletConnector = WalletConnector;
window.WALLET_TYPES = WALLET_TYPES;
