// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CPCToken is ERC20, Ownable {
    constructor() ERC20("Common Prosperity", "CPC") Ownable(msg.sender) {
        _mint(msg.sender, 13_370_000 * 1e18); // 13.37M CPC
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}
