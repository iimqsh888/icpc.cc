// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Mining is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable cpcToken;
    IERC721 public immutable rewardNFT;
    IERC20 public immutable usdt;
    address public constant teamAddress = 0x28D176D6876DcdD906e70932B5c01Fe91A5Bf4d5;

    uint256 public constant POOL = 10_696_000 * 1e18; // 80%
    uint256 public constant LOCK_PERIOD = 3650 days; // 10 years
    uint256 public constant INIT_RATE = 1e18; // 1 CPC per hour
    uint256 public constant HALVE_THRESHOLD = 133_700 * 1e18; // Halve every 133,700 CPC distributed
    uint256 public constant INIT_WEIGHT = 5_000 * 1e18; // Initial weight 5,000 CPC
    uint256 public constant MIN_STAKE = 10 * 1e18; // Minimum stake 10 CPC
    uint256 public constant TICKET_FEE = 2 * 1e18; // 2 USDT
    uint256 public constant NFT_DAILY = 1e18; // 1 CPC per day
    uint256 public constant NFT_INTERVAL = 24 hours;

    uint256 public currentRate = INIT_RATE;
    uint256 public totalDistributed;
    uint256 public halveCount;
    uint256 public lastUpdate;
    uint256 public rewardPerTokenStored;

    uint256 public totalStaked;
    mapping(address => bool) public hasPaidTicket;
    mapping(address => uint256) public staked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lockEnd;
    mapping(address => uint256) public lastNftClaim;

    event TicketPaid(address indexed user);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event NftRewardClaimed(address indexed user, uint256 amount);
    event Halved(uint256 newRate, uint256 halveCount);

    constructor(
        address _cpcToken,
        address _rewardNFT,
        address _usdt
    ) Ownable(msg.sender) {
        cpcToken = IERC20(_cpcToken);
        rewardNFT = IERC721(_rewardNFT);
        usdt = IERC20(_usdt);
        lastUpdate = block.timestamp;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdate = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        uint256 timeElapsed = block.timestamp - lastUpdate;
        uint256 rewardAmount = (timeElapsed * currentRate) / 3600; // per hour
        
        uint256 effectiveStaked = totalStaked < INIT_WEIGHT ? INIT_WEIGHT : totalStaked;
        return rewardPerTokenStored + (rewardAmount * 1e18) / effectiveStaked;
    }

    function earned(address account) public view returns (uint256) {
        uint256 userStake = staked[account];
        return (userStake * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }

    function payTicket() external nonReentrant {
        require(!hasPaidTicket[msg.sender], "Already paid");
        usdt.safeTransferFrom(msg.sender, teamAddress, TICKET_FEE);
        hasPaidTicket[msg.sender] = true;
        emit TicketPaid(msg.sender);
    }

    function stake(uint256 amount) external updateReward(msg.sender) nonReentrant {
        require(hasPaidTicket[msg.sender], "Pay ticket first");
        require(amount >= MIN_STAKE, "Minimum 10 CPC");
        require(amount % 1e18 == 0, "Must be integer CPC");

        cpcToken.safeTransferFrom(msg.sender, address(this), amount);

        staked[msg.sender] += amount;
        totalStaked += amount;
        lockEnd[msg.sender] = block.timestamp + LOCK_PERIOD;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external updateReward(msg.sender) nonReentrant {
        require(block.timestamp >= lockEnd[msg.sender], "Still locked");
        require(amount <= staked[msg.sender], "Insufficient balance");
        require(amount % 1e18 == 0, "Must be integer CPC");

        staked[msg.sender] -= amount;
        totalStaked -= amount;
        cpcToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external updateReward(msg.sender) nonReentrant {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards");
        
        rewards[msg.sender] = 0;
        _distributeAndCheckHalve(reward);
        cpcToken.safeTransfer(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward);
    }

    function claimNftReward() external nonReentrant {
        require(rewardNFT.balanceOf(msg.sender) > 0, "No NFT");
        require(block.timestamp >= lastNftClaim[msg.sender] + NFT_INTERVAL, "Wait 24h");

        uint256 reward = NFT_DAILY >> halveCount; // Halved reward
        require(totalDistributed + reward <= POOL, "Pool exhausted");

        lastNftClaim[msg.sender] = block.timestamp;
        _distributeAndCheckHalve(reward);
        cpcToken.safeTransfer(msg.sender, reward);
        
        emit NftRewardClaimed(msg.sender, reward);
    }

    function _distributeAndCheckHalve(uint256 amount) internal {
        totalDistributed += amount;
        
        uint256 nextHalveThreshold = HALVE_THRESHOLD * (halveCount + 1);
        if (totalDistributed >= nextHalveThreshold && currentRate > 0) {
            currentRate = currentRate / 2;
            halveCount++;
            emit Halved(currentRate, halveCount);
        }
    }

    // Get halving progress information
    function getHalvingInfo() external view returns (
        uint256 currentHalveCount,
        uint256 currentMiningRate,
        uint256 totalDistributedAmount,
        uint256 nextHalveThreshold,
        uint256 progressToNextHalve,
        uint256 percentageToNextHalve
    ) {
        currentHalveCount = halveCount;
        currentMiningRate = currentRate;
        totalDistributedAmount = totalDistributed;
        nextHalveThreshold = HALVE_THRESHOLD * (halveCount + 1);
        
        // Calculate progress within current halving cycle
        uint256 currentHalveStart = HALVE_THRESHOLD * halveCount;
        progressToNextHalve = totalDistributed > currentHalveStart ? 
            totalDistributed - currentHalveStart : 0;
        
        // Calculate percentage (0-100)
        if (progressToNextHalve > 0) {
            percentageToNextHalve = (progressToNextHalve * 100) / HALVE_THRESHOLD;
        } else {
            percentageToNextHalve = 0;
        }
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}