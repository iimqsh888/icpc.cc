// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CPCVoting
 * @dev Rolling 30-day voting system for OTC revenue distribution
 * @notice Winner of each round gets real-time revenue for next 30 days
 */
contract CPCVoting is ReentrancyGuard {
    
    IERC20 public immutable cpcToken;
    
    uint256 public constant ROUND_DURATION = 30 days;
    uint256 public constant CANDIDATE_STAKE = 1e18; // 1 CPC
    uint256 public constant MIN_VOTE_BALANCE = 1e18; // 1 CPC to vote
    
    // Current revenue holder (receives real-time OTC fees)
    address public currentRevenueHolder;
    
    // Round tracking
    uint256 public votingRound = 1;
    uint256 public roundStartTime;
    uint256 public roundEndTime;
    
    // First round accumulated fees (before first winner)
    uint256 public accumulatedFees;
    bool public firstRoundClaimed;
    
    // Round => Candidate => isCandidate
    mapping(uint256 => mapping(address => bool)) public candidates;
    
    // Round => Candidate => voteCount
    mapping(uint256 => mapping(address => uint256)) public votes;
    
    // Round => Voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Round => Candidate => hasStaked
    mapping(uint256 => mapping(address => bool)) public hasStaked;
    
    // Track all candidates for ranking
    mapping(uint256 => address[]) public candidateList;
    
    // Events
    event CandidateRegistered(uint256 indexed round, address indexed candidate);
    event VoteCast(uint256 indexed round, address indexed voter, address indexed candidate);
    event RevenueRightClaimed(uint256 indexed round, address indexed winner, uint256 reward);
    event StakeWithdrawn(uint256 indexed round, address indexed candidate, uint256 amount);
    event FeeReceived(uint256 amount);
    
    constructor(address _cpcToken) {
        require(_cpcToken != address(0), "Invalid token");
        
        cpcToken = IERC20(_cpcToken);
        
        roundStartTime = block.timestamp;
        roundEndTime = block.timestamp + ROUND_DURATION;
    }
    
    /**
     * @dev Become candidate by staking 1 CPC
     */
    function becomeCandidate() external nonReentrant {
        require(!candidates[votingRound][msg.sender], "Already candidate");
        require(!hasStaked[votingRound][msg.sender], "Already staked");
        require(block.timestamp < roundEndTime, "Round ended");
        
        // Transfer stake
        require(
            cpcToken.transferFrom(msg.sender, address(this), CANDIDATE_STAKE),
            "Stake transfer failed"
        );
        
        candidates[votingRound][msg.sender] = true;
        hasStaked[votingRound][msg.sender] = true;
        candidateList[votingRound].push(msg.sender);
        
        emit CandidateRegistered(votingRound, msg.sender);
    }
    
    /**
     * @dev Vote for candidate (free, just need to hold 1 CPC)
     */
    function vote(address candidate) external nonReentrant {
        require(block.timestamp < roundEndTime, "Round ended");
        require(candidates[votingRound][candidate], "Not a candidate");
        require(!hasVoted[votingRound][msg.sender], "Already voted");
        require(candidate != msg.sender, "Cannot self-vote");
        require(cpcToken.balanceOf(msg.sender) >= MIN_VOTE_BALANCE, "Need 1 CPC to vote");
        
        votes[votingRound][candidate]++;
        hasVoted[votingRound][msg.sender] = true;
        
        emit VoteCast(votingRound, msg.sender, candidate);
    }
    
    /**
     * @dev Claim revenue right (called by winner to start earning)
     * @notice Winner claims the right to receive next 30 days of OTC fees
     */
    function claimRevenueRight() external nonReentrant {
        require(block.timestamp >= roundEndTime, "Round not ended");
        
        address winner = getWinner();
        require(winner != address(0), "No winner");
        require(msg.sender == winner, "Not the winner");
        
        uint256 reward = 0;
        
        // First round: transfer accumulated fees to winner
        if (!firstRoundClaimed) {
            reward = accumulatedFees;
            if (reward > 0) {
                accumulatedFees = 0;
                (bool success, ) = payable(winner).call{value: reward}("");
                require(success, "Reward transfer failed");
            }
            firstRoundClaimed = true;
        }
        
        // Set new revenue holder
        currentRevenueHolder = winner;
        
        emit RevenueRightClaimed(votingRound, winner, reward);
        
        // Start new voting round
        votingRound++;
        roundStartTime = block.timestamp;
        roundEndTime = block.timestamp + ROUND_DURATION;
    }
    
    /**
     * @dev Allow anyone to trigger round settlement if winner doesn't claim
     * @notice Fallback mechanism to prevent system from getting stuck
     */
    function settleRoundFallback() external nonReentrant {
        require(block.timestamp >= roundEndTime + 7 days, "Wait 7 days after round end");
        
        address winner = getWinner();
        
        uint256 reward = 0;
        
        // First round: transfer accumulated fees to winner
        if (!firstRoundClaimed && winner != address(0)) {
            reward = accumulatedFees;
            if (reward > 0) {
                accumulatedFees = 0;
                (bool success, ) = payable(winner).call{value: reward}("");
                require(success, "Reward transfer failed");
            }
            firstRoundClaimed = true;
        }
        
        // Set new revenue holder (or keep current if no winner)
        if (winner != address(0)) {
            currentRevenueHolder = winner;
        }
        
        emit RevenueRightClaimed(votingRound, winner, reward);
        
        // Start new voting round
        votingRound++;
        roundStartTime = block.timestamp;
        roundEndTime = block.timestamp + ROUND_DURATION;
    }
    
    /**
     * @dev Withdraw stake after round ends
     */
    function withdrawStake(uint256 round) external nonReentrant {
        require(round < votingRound, "Round not ended");
        require(hasStaked[round][msg.sender], "No stake to withdraw");
        
        hasStaked[round][msg.sender] = false;
        
        require(
            cpcToken.transfer(msg.sender, CANDIDATE_STAKE),
            "Stake withdrawal failed"
        );
        
        emit StakeWithdrawn(round, msg.sender, CANDIDATE_STAKE);
    }
    
    /**
     * @dev Get current revenue holder (for OTC contract to query)
     */
    function getCurrentRevenueHolder() external view returns (address) {
        return currentRevenueHolder;
    }
    
    /**
     * @dev Get winner of current voting round
     */
    function getWinner() public view returns (address) {
        address[] memory candidates_ = candidateList[votingRound];
        if (candidates_.length == 0) return address(0);
        
        address winner = candidates_[0];
        uint256 maxVotes = votes[votingRound][winner];
        
        for (uint256 i = 1; i < candidates_.length; i++) {
            uint256 candidateVotes = votes[votingRound][candidates_[i]];
            if (candidateVotes > maxVotes) {
                maxVotes = candidateVotes;
                winner = candidates_[i];
            }
        }
        
        return maxVotes > 0 ? winner : address(0);
    }
    
    /**
     * @dev Get top N candidates with vote counts
     */
    function getTopCandidates(uint256 n) external view returns (
        address[] memory topAddresses,
        uint256[] memory topVotes
    ) {
        address[] memory candidates_ = candidateList[votingRound];
        uint256 length = candidates_.length > n ? n : candidates_.length;
        
        topAddresses = new address[](length);
        topVotes = new uint256[](length);
        
        if (candidates_.length == 0) return (topAddresses, topVotes);
        
        // Simple bubble sort for top N
        address[] memory sorted = new address[](candidates_.length);
        uint256[] memory sortedVotes = new uint256[](candidates_.length);
        
        for (uint256 i = 0; i < candidates_.length; i++) {
            sorted[i] = candidates_[i];
            sortedVotes[i] = votes[votingRound][candidates_[i]];
        }
        
        // Sort descending
        for (uint256 i = 0; i < sorted.length && i < n; i++) {
            for (uint256 j = i + 1; j < sorted.length; j++) {
                if (sortedVotes[j] > sortedVotes[i]) {
                    (sorted[i], sorted[j]) = (sorted[j], sorted[i]);
                    (sortedVotes[i], sortedVotes[j]) = (sortedVotes[j], sortedVotes[i]);
                }
            }
        }
        
        // Return top N
        for (uint256 i = 0; i < length; i++) {
            topAddresses[i] = sorted[i];
            topVotes[i] = sortedVotes[i];
        }
        
        return (topAddresses, topVotes);
    }
    
    /**
     * @dev Get candidate count for current round
     */
    function getCandidateCount() external view returns (uint256) {
        return candidateList[votingRound].length;
    }
    
    /**
     * @dev Get time remaining in current voting round
     */
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= roundEndTime) return 0;
        return roundEndTime - block.timestamp;
    }
    
    /**
     * @dev Check if address can vote in current round
     */
    function canVote(address voter) external view returns (bool) {
        return !hasVoted[votingRound][voter] && 
               cpcToken.balanceOf(voter) >= MIN_VOTE_BALANCE &&
               block.timestamp < roundEndTime;
    }
    
    /**
     * @dev Check if address is candidate in current round
     */
    function isCandidate(address addr) external view returns (bool) {
        return candidates[votingRound][addr];
    }
    
    /**
     * @dev Check if round can be settled
     */
    function canSettle() external view returns (bool) {
        return block.timestamp >= roundEndTime;
    }
    
    /**
     * @dev Receive BNB fees from OTC contract
     */
    receive() external payable {
        // If first round not claimed yet, accumulate fees
        if (!firstRoundClaimed) {
            accumulatedFees += msg.value;
        } else {
            // Forward to current revenue holder
            if (currentRevenueHolder != address(0)) {
                (bool success, ) = payable(currentRevenueHolder).call{value: msg.value}("");
                require(success, "Fee forward failed");
            } else {
                // Fallback: accumulate if no revenue holder
                accumulatedFees += msg.value;
            }
        }
        
        emit FeeReceived(msg.value);
    }
}
