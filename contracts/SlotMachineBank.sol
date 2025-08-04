// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title SlotMachineBank
 * @dev Smart contract for managing player balances in Cherry Charm slot machine
 * @notice This contract handles deposits, withdrawals, and balance updates for the game
 * Uses native IRYS tokens (like ETH)
 */
contract SlotMachineBank {
    
    // Contract owner
    address public owner;
    
    // Server wallet that can modify player balances
    address public serverWallet;
    
    // Player balances mapping (in-game balance)
    mapping(address => uint256) public playerBalances;
    
    // Total deposited amount for accounting
    uint256 public totalDeposited;
    
    // Minimum deposit amount (0.01 IRYS)
    uint256 public minDeposit = 0.01 ether;
    
    // Contract paused state
    bool public paused = false;
    
    // Reentrancy guard
    bool private locked = false;
    
    // Events
    event Deposit(address indexed player, uint256 amount, uint256 newBalance);
    event Withdrawal(address indexed player, uint256 amount, uint256 newBalance);
    event BalanceUpdated(address indexed player, int256 change, uint256 newBalance, string reason);
    event ServerWalletUpdated(address indexed oldServer, address indexed newServer);
    event MinDepositUpdated(uint256 oldAmount, uint256 newAmount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    
    // Errors
    error InvalidAddress();
    error InsufficientBalance();
    error InsufficientContractBalance();
    error TransferFailed();
    error AmountTooSmall();
    error BelowMinimumDeposit();
    error OnlyOwner();
    error OnlyServer();
    error ContractPaused();
    error ReentrancyGuard();
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier onlyServer() {
        if (msg.sender != serverWallet) revert OnlyServer();
        _;
    }
    
    modifier validAddress(address _address) {
        if (_address == address(0)) revert InvalidAddress();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }
    
    modifier nonReentrant() {
        if (locked) revert ReentrancyGuard();
        locked = true;
        _;
        locked = false;
    }
    
    /**
     * @dev Constructor
     * @param _serverWallet Address of the server wallet
     */
    constructor(address _serverWallet) validAddress(_serverWallet) {
        owner = msg.sender;
        serverWallet = _serverWallet;
    }
    
    /**
     * @dev Deposit native IRYS tokens to player's game balance
     * Players call this function directly from frontend
     */
    function deposit() external payable nonReentrant whenNotPaused {
        if (msg.value < minDeposit) revert BelowMinimumDeposit();
        if (msg.value == 0) revert AmountTooSmall();
        
        // Update player balance
        playerBalances[msg.sender] += msg.value;
        totalDeposited += msg.value;
        
        emit Deposit(msg.sender, msg.value, playerBalances[msg.sender]);
    }
    
    /**
     * @dev Withdraw native IRYS tokens from player's game balance
     * Players call this function directly from frontend
     * @param amount Amount of IRYS tokens to withdraw (in wei)
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountTooSmall();
        if (playerBalances[msg.sender] < amount) revert InsufficientBalance();
        if (address(this).balance < amount) revert InsufficientContractBalance();
        
        // Update player balance
        playerBalances[msg.sender] -= amount;
        totalDeposited -= amount;
        
        // Transfer native tokens to player
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawal(msg.sender, amount, playerBalances[msg.sender]);
    }
    
    /**
     * @dev Update player balance (only server can call)
     * @param player Address of the player
     * @param change Amount to add (positive) or subtract (negative) in wei
     * @param reason Reason for balance change (e.g., "win", "loss", "bet")
     */
    function updateBalance(
        address player,
        int256 change,
        string calldata reason
    ) external onlyServer whenNotPaused validAddress(player) {
        
        if (change < 0) {
            uint256 absChange = uint256(-change);
            if (playerBalances[player] < absChange) revert InsufficientBalance();
            playerBalances[player] -= absChange;
        } else if (change > 0) {
            playerBalances[player] += uint256(change);
        }
        // If change is 0, no balance update needed
        
        emit BalanceUpdated(player, change, playerBalances[player], reason);
    }
    
    /**
     * @dev Get player's current balance
     * @param player Address of the player
     * @return Player's balance in wei
     */
    function getBalance(address player) external view returns (uint256) {
        return playerBalances[player];
    }
    
    /**
     * @dev Check if player has sufficient balance for a bet
     * @param player Address of the player
     * @param betAmount Amount of the bet in wei
     * @return True if player has sufficient balance
     */
    function hasSufficientBalance(address player, uint256 betAmount) external view returns (bool) {
        return playerBalances[player] >= betAmount;
    }
    
    // Admin functions
    
    /**
     * @dev Update server wallet address (only owner)
     * @param newServerWallet New server wallet address
     */
    function updateServerWallet(address newServerWallet) external onlyOwner validAddress(newServerWallet) {
        address oldServer = serverWallet;
        serverWallet = newServerWallet;
        emit ServerWalletUpdated(oldServer, newServerWallet);
    }
    
    /**
     * @dev Update minimum deposit amount (only owner)
     * @param newMinDeposit New minimum deposit amount in wei
     */
    function updateMinDeposit(uint256 newMinDeposit) external onlyOwner {
        if (newMinDeposit == 0) revert AmountTooSmall();
        uint256 oldAmount = minDeposit;
        minDeposit = newMinDeposit;
        emit MinDepositUpdated(oldAmount, newMinDeposit);
    }
    
    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    /**
     * @dev Transfer ownership (only owner)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner validAddress(newOwner) {
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @dev Emergency withdrawal of contract's native balance (only owner)
     * @param amount Amount to withdraw in wei
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert AmountTooSmall();
        if (address(this).balance < amount) revert InsufficientContractBalance();
        
        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Get contract's native token balance
     * @return Contract's IRYS token balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalDeposited Total amount deposited
     * @return contractBalance Current contract balance
     */
    function getContractStats() external view returns (uint256, uint256) {
        return (totalDeposited, address(this).balance);
    }
    
    // Fallback function to receive native tokens
    receive() external payable {
        // Allow contract to receive native tokens
        // This is useful for emergency funding or other admin operations
    }
}