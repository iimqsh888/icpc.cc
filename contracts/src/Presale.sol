// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RewardNFT.sol";

contract Presale is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    RewardNFT public immutable nft;
    address public constant teamAddress = 0x28D176D6876DcdD906e70932B5c01Fe91A5Bf4d5;

    uint256 public constant TOTAL_SALE = 1_337_000 * 1e18; // 10%
    uint256 public constant RATE = 1337 * 1e17; // 133.7 CPC per BNB
    uint256 public constant DURATION = 365 days;
    uint256 public constant MIN_BNB = 1 ether; // 最低1 BNB

    uint256 public immutable startTime;
    uint256 public tokensSold;

    mapping(address => bool) public hasNFT;

    event TokensPurchased(address indexed buyer, uint256 bnbAmount, uint256 tokenAmount);
    event NFTMinted(address indexed buyer);
    event RemainingWithdrawn(address indexed team, uint256 amount);

    constructor(address _token, address _nft) Ownable(msg.sender) {
        token = IERC20(_token);
        nft = RewardNFT(_nft);
        startTime = block.timestamp;
    }

    function buy() external payable nonReentrant {
        require(block.timestamp < startTime + DURATION, "Presale ended");
        require(msg.value >= MIN_BNB, "Minimum 1 BNB");
        
        uint256 tokens = (msg.value * RATE) / 1e18;
        require(tokensSold + tokens <= TOTAL_SALE, "Sold out");

        tokensSold += tokens;

        require(token.transfer(msg.sender, tokens), "Token transfer failed");
        
        (bool sent, ) = payable(teamAddress).call{value: msg.value}("");
        require(sent, "BNB transfer failed");

        emit TokensPurchased(msg.sender, msg.value, tokens);

        if (!hasNFT[msg.sender] && nft.balanceOf(msg.sender) == 0) {
            nft.safeMint(msg.sender);
            hasNFT[msg.sender] = true;
            emit NFTMinted(msg.sender);
        }
    }

    function claimRemaining() external {
        require(msg.sender == teamAddress, "Not team");
        require(block.timestamp >= startTime + DURATION, "Lock period not ended");
        
        uint256 remaining = token.balanceOf(address(this));
        require(remaining > 0, "No tokens to withdraw");
        require(token.transfer(teamAddress, remaining), "Transfer failed");
        
        emit RemainingWithdrawn(teamAddress, remaining);
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}