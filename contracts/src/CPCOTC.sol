// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CPCOTC is ReentrancyGuard {
    IERC20 public immutable cpcToken;
    address public immutable votingContract;
    uint256 public constant ORDER_CREATION_FEE = 0.001 ether;
    uint256 public constant TRADE_FEE_PERCENT = 20;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public nextOrderId = 1;
    
    struct Order {
        uint256 orderId;
        address creator;
        bool isBuyOrder;
        uint256 tokenAmount;
        uint256 remainingAmount;
        uint256 pricePerToken;
        uint256 totalValue;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public userOrders;
    uint256[] public activeOrderIds;
    
    event OrderCreated(uint256 indexed orderId, address indexed creator, bool isBuyOrder, uint256 tokenAmount, uint256 pricePerToken, uint256 totalValue);
    event OrderFilled(uint256 indexed orderId, address indexed creator, address indexed filler, uint256 tokenAmount, uint256 totalValue);
    event OrderCancelled(uint256 indexed orderId, address indexed creator);
    
    constructor(address _cpcToken, address _votingContract) {
        require(_cpcToken != address(0) && _votingContract != address(0), "Invalid address");
        cpcToken = IERC20(_cpcToken);
        votingContract = _votingContract;
    }
    
    function createBuyOrder(uint256 tokenAmount, uint256 pricePerToken) external payable nonReentrant {
        require(tokenAmount > 0 && tokenAmount % 1e18 == 0 && pricePerToken > 0, "Invalid params");
        uint256 totalValue = (tokenAmount * pricePerToken) / 1e18;
        require(msg.value >= totalValue + ORDER_CREATION_FEE, "Insufficient BNB");
        
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order(orderId, msg.sender, true, tokenAmount, tokenAmount, pricePerToken, totalValue, true, block.timestamp);
        userOrders[msg.sender].push(orderId);
        activeOrderIds.push(orderId);
        
        (bool success1, ) = payable(votingContract).call{value: ORDER_CREATION_FEE}("");
        require(success1, "Fee transfer failed");
        if (msg.value > totalValue + ORDER_CREATION_FEE) {
            (bool success2, ) = payable(msg.sender).call{value: msg.value - totalValue - ORDER_CREATION_FEE}("");
            require(success2, "Refund failed");
        }
        emit OrderCreated(orderId, msg.sender, true, tokenAmount, pricePerToken, totalValue);
    }
    
    function createSellOrder(uint256 tokenAmount, uint256 pricePerToken) external payable nonReentrant {
        require(tokenAmount > 0 && tokenAmount % 1e18 == 0 && pricePerToken > 0, "Invalid params");
        require(msg.value >= ORDER_CREATION_FEE, "Insufficient fee");
        require(cpcToken.transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");
        
        uint256 totalValue = (tokenAmount * pricePerToken) / 1e18;
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order(orderId, msg.sender, false, tokenAmount, tokenAmount, pricePerToken, totalValue, true, block.timestamp);
        userOrders[msg.sender].push(orderId);
        activeOrderIds.push(orderId);
        
        (bool success1, ) = payable(votingContract).call{value: ORDER_CREATION_FEE}("");
        require(success1, "Fee transfer failed");
        if (msg.value > ORDER_CREATION_FEE) {
            (bool success2, ) = payable(msg.sender).call{value: msg.value - ORDER_CREATION_FEE}("");
            require(success2, "Refund failed");
        }
        emit OrderCreated(orderId, msg.sender, false, tokenAmount, pricePerToken, totalValue);
    }
    
    function fillBuyOrder(uint256 orderId, uint256 fillAmount) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive && order.isBuyOrder && order.creator != msg.sender, "Invalid");
        uint256 amount = fillAmount == 0 ? order.remainingAmount : fillAmount;
        require(amount > 0 && amount % 1e18 == 0 && amount <= order.remainingAmount, "Invalid fill");
        
        uint256 bnbValue = (order.totalValue * amount) / order.tokenAmount;
        uint256 bnbFee = (bnbValue * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        
        order.remainingAmount -= amount;
        if (order.remainingAmount == 0) { order.isActive = false; _removeFromActive(orderId); }
        
        require(cpcToken.transferFrom(msg.sender, order.creator, amount), "Transfer failed");
        (bool success1, ) = payable(msg.sender).call{value: bnbValue - bnbFee}("");
        require(success1, "Payment failed");
        if (bnbFee > 0) {
            (bool success2, ) = payable(votingContract).call{value: bnbFee}("");
            require(success2, "Fee transfer failed");
        }
        emit OrderFilled(orderId, order.creator, msg.sender, amount, bnbValue);
    }
    
    function fillSellOrder(uint256 orderId, uint256 fillAmount) external payable nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive && !order.isBuyOrder && order.creator != msg.sender, "Invalid");
        uint256 amount = fillAmount == 0 ? order.remainingAmount : fillAmount;
        require(amount > 0 && amount % 1e18 == 0 && amount <= order.remainingAmount, "Invalid fill");
        
        uint256 bnbValue = (order.totalValue * amount) / order.tokenAmount;
        require(msg.value >= bnbValue, "Insufficient BNB");
        uint256 bnbFee = (bnbValue * TRADE_FEE_PERCENT) / FEE_DENOMINATOR;
        
        order.remainingAmount -= amount;
        if (order.remainingAmount == 0) { order.isActive = false; _removeFromActive(orderId); }
        
        require(cpcToken.transfer(msg.sender, amount), "Transfer failed");
        (bool success1, ) = payable(order.creator).call{value: bnbValue - bnbFee}("");
        require(success1, "Payment failed");
        if (bnbFee > 0) {
            (bool success2, ) = payable(votingContract).call{value: bnbFee}("");
            require(success2, "Fee transfer failed");
        }
        if (msg.value > bnbValue) {
            (bool success3, ) = payable(msg.sender).call{value: msg.value - bnbValue}("");
            require(success3, "Refund failed");
        }
        emit OrderFilled(orderId, order.creator, msg.sender, amount, bnbValue);
    }
    
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive && order.creator == msg.sender, "Invalid");
        uint256 refund = order.remainingAmount;
        order.isActive = false;
        order.remainingAmount = 0;
        _removeFromActive(orderId);
        
        if (order.isBuyOrder) {
            (bool success, ) = payable(msg.sender).call{value: (order.totalValue * refund) / order.tokenAmount}("");
            require(success, "Refund failed");
        } else {
            require(cpcToken.transfer(msg.sender, refund), "Refund failed");
        }
        emit OrderCancelled(orderId, msg.sender);
    }
    
    function _removeFromActive(uint256 orderId) private {
        for (uint256 i = 0; i < activeOrderIds.length; i++) {
            if (activeOrderIds[i] == orderId) {
                activeOrderIds[i] = activeOrderIds[activeOrderIds.length - 1];
                activeOrderIds.pop();
                break;
            }
        }
    }
    
    function getActiveOrderCount() external view returns (uint256) { return activeOrderIds.length; }
    function getUserOrderCount(address user) external view returns (uint256) { return userOrders[user].length; }
    function getUserOrders(address user) external view returns (uint256[] memory) { return userOrders[user]; }
    function getActiveOrders(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (offset >= activeOrderIds.length) return new uint256[](0);
        uint256 end = offset + limit > activeOrderIds.length ? activeOrderIds.length : offset + limit;
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) result[i - offset] = activeOrderIds[i];
        return result;
    }
    
    receive() external payable { revert("No direct transfers"); }
    fallback() external payable { revert("No fallback"); }
}
