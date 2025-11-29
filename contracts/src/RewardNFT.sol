// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract RewardNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    address public minter;
    
    // IPFS animated image link
    string public constant BASE_IMAGE_URI = "ipfs://bafybeibaw5ich25wqbpu6vjmzmlfjfl6egbnfbdnf52zevsx44kxnvtwzq";

    event MinterSet(address indexed minter);

    constructor() ERC721("CPC-NFT", "CPC-NFT") Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterSet(_minter);
    }

    function safeMint(address to) external {
        require(msg.sender == minter, "Not minter");
        require(balanceOf(to) == 0, "Already has NFT");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Soulbound: cannot transfer");
        return super._update(to, tokenId, auth);
    }

    // Generate on-chain metadata, each NFT has unique number
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        string memory json = string(abi.encodePacked(
            '{"name":"CPC-NFT #', tokenId.toString(), '",',
            '"description":"Proof of presale participation. Grants daily 1 CPC mining reward (follows halving logic).",',
            '"image":"', BASE_IMAGE_URI, '",',
            '"attributes":[',
            '{"trait_type":"Token ID","value":"', tokenId.toString(), '"},',
            '{"trait_type":"Type","value":"Presale Contributor"},',
            '{"trait_type":"Reward","value":"1 CPC/day"},',
            '{"trait_type":"Status","value":"Active"},',
            '{"trait_type":"Transferable","value":"No"}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    function renounceOwnership() public override onlyOwner {
        super.renounceOwnership();
    }
}