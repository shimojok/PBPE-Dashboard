```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title YieldLinkedToken
 * @dev ERC20 token representing yield increase from MBT55 application
 */
contract YieldLinkedToken is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    struct YieldPool {
        uint256 targetYield;        // Target yield in kg
        uint256 actualYield;        // Actual yield achieved
        uint256 baselineYield;      // Baseline yield without MBT55
        uint256 settlementPrice;    // USD per kg × 100
        uint256 totalTokens;        // Total tokens issued
        uint256 tokensRedeemed;     // Tokens already redeemed
        bool settled;              // Whether pool is settled
        uint256 settlementDate;     // Settlement timestamp
    }

    mapping(string => YieldPool) public pools;  // poolId => YieldPool
    mapping(address => mapping(string => uint256)) public poolBalances;  // user => poolId => balance

    // Oracle address for yield reporting
    address public yieldOracle;

    // Events
    event TokensIssued(
        string indexed poolId,
        address indexed recipient,
        uint256 amount,
        uint256 targetYield
    );
    event YieldReported(string indexed poolId, uint256 actualYield);
    event PoolSettled(
        string indexed poolId,
        uint256 payoutPerToken,
        uint256 totalPayout
    );
    event TokensRedeemed(
        string indexed poolId,
        address indexed user,
        uint256 tokenAmount,
        uint256 payoutAmount
    );

    constructor() ERC20("Yield-Linked Token", "YLT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(SETTLEMENT_ROLE, msg.sender);
    }

    /**
     * @dev Create a new yield pool and issue tokens
     * @param poolId Unique pool identifier
     * @param targetYield Target yield in kg
     * @param baselineYield Baseline yield without MBT55
     * @param settlementPrice Settlement price per kg (×100)
     */
    function createYieldPool(
        string memory poolId,
        uint256 targetYield,
        uint256 baselineYield,
        uint256 settlementPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(pools[poolId].targetYield == 0, "Pool already exists");
        require(targetYield > baselineYield, "Target must exceed baseline");
        require(settlementPrice > 0, "Invalid settlement price");

        pools[poolId] = YieldPool({
            targetYield: targetYield,
            actualYield: 0,
            baselineYield: baselineYield,
            settlementPrice: settlementPrice,
            totalTokens: 0,
            tokensRedeemed: 0,
            settled: false,
            settlementDate: 0
        });
    }

    /**
     * @dev Issue tokens to investor based on investment amount
     */
    function issueTokens(
        string memory poolId,
        address recipient,
        uint256 investmentAmount  // USD × 100
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        YieldPool storage pool = pools[poolId];
        require(pool.targetYield > 0, "Pool does not exist");
        require(!pool.settled, "Pool already settled");

        // Token amount proportional to share of target yield value
        uint256 targetValue = (pool.targetYield - pool.baselineYield) * pool.settlementPrice;
        uint256 tokenAmount = (investmentAmount * 1e18) / targetValue;

        pool.totalTokens += tokenAmount;
        poolBalances[recipient][poolId] += tokenAmount;

        _mint(recipient, tokenAmount);

        emit TokensIssued(poolId, recipient, tokenAmount, pool.targetYield);
    }

    /**
     * @dev Report actual yield (oracle only)
     */
    function reportYield(string memory poolId, uint256 actualYield) 
        external onlyRole(ORACLE_ROLE) {
        YieldPool storage pool = pools[poolId];
        require(pool.targetYield > 0, "Pool does not exist");
        require(!pool.settled, "Pool already settled");
        require(actualYield > 0, "Invalid yield");

        pool.actualYield = actualYield;

        emit YieldReported(poolId, actualYield);
    }

    /**
     * @dev Settle pool and calculate payout
     */
    function settlePool(string memory poolId) 
        external onlyRole(SETTLEMENT_ROLE) {
        YieldPool storage pool = pools[poolId];
        require(pool.targetYield > 0, "Pool does not exist");
        require(!pool.settled, "Pool already settled");
        require(pool.actualYield > 0, "Yield not reported");

        pool.settled = true;
        pool.settlementDate = block.timestamp;

        uint256 yieldIncrease = pool.actualYield > pool.baselineYield 
            ? pool.actualYield - pool.baselineYield 
            : 0;
        uint256 totalPayoutValue = yieldIncrease * pool.settlementPrice;
        uint256 payoutPerToken = pool.totalTokens > 0 
            ? (totalPayoutValue * 1e18) / pool.totalTokens 
            : 0;

        emit PoolSettled(poolId, payoutPerToken, totalPayoutValue);
    }

    /**
     * @dev Get payout per token for a settled pool
     */
    function getPayoutPerToken(string memory poolId) 
        public view returns (uint256) {
        YieldPool storage pool = pools[poolId];
        require(pool.settled, "Pool not settled");

        uint256 yieldIncrease = pool.actualYield > pool.baselineYield 
            ? pool.actualYield - pool.baselineYield 
            : 0;
        uint256 totalPayoutValue = yieldIncrease * pool.settlementPrice;
        
        return pool.totalTokens > 0 
            ? (totalPayoutValue * 1e18) / pool.totalTokens 
            : 0;
    }

    /**
     * @dev Get user's pending payout
     */
    function getPendingPayout(address user, string memory poolId) 
        public view returns (uint256) {
        uint256 balance = poolBalances[user][poolId];
        if (balance == 0) return 0;
        
        uint256 payoutPerToken = getPayoutPerToken(poolId);
        return (balance * payoutPerToken) / 1e18;
    }

    // Override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setYieldOracle(address newOracle) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        yieldOracle = newOracle;
    }
}
```
