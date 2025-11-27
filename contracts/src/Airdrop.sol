// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Airdrop is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    IERC721 public immutable babt = IERC721(0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8);

    uint256 public constant CLAIM_AMOUNT = 1e18; // 1 CPC
    uint256 public totalClaimed;

    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed user, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function claim() external nonReentrant {
        require(babt.balanceOf(msg.sender) > 0, "No BABT NFT");
        require(!hasClaimed[msg.sender], "Already claimed");
        require(token.balanceOf(address(this)) >= CLAIM_AMOUNT, "Insufficient balance");

        hasClaimed[msg.sender] = true;
        totalClaimed += CLAIM_AMOUNT;
        require(token.transfer(msg.sender, CLAIM_AMOUNT), "Transfer failed");
        
        emit Claimed(msg.sender, CLAIM_AMOUNT);
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}