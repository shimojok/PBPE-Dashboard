```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title RegenerativeBond
 * @dev ERC20 token representing a bond backed by future carbon sequestration
 */
contract RegenerativeBond is ERC20, AccessControl, ReentrancyGuard {
    using Math for uint256;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct BondSeries {
        string seriesId;
        uint256 faceValue;           // USD × 100
        uint256 couponRate;          // Basis points (e.g., 600 = 6%)
        uint256 totalSupply;         // Total bonds issued
        uint256 issuedAmount;        // Amount issued so far
        uint256 maturityDate;        // Unix timestamp
        uint256 couponFrequency;     // Seconds between coupon payments
        uint256 lastCouponDate;      // Last coupon payment timestamp
        uint256 carbonTarget;        // tCO₂e target
        uint256 carbonAchieved;      // tCO₂e achieved (oracle update)
        bool active;
        bool matured;
    }

    struct BondHolding {
        string seriesId;
        uint256 amount;
        uint256 purchaseDate;
        uint256 lastClaimedCoupon;
    }

    // Series ID => BondSeries
    mapping(string => BondSeries) public bondSeries;
    
    // Address => Series ID => BondHolding
    mapping(address => mapping(string => BondHolding)) public holdings;
    
    // Address => Series ID list
    mapping(address => string[]) public userSeries;

    // Oracle address for carbon verification
    address public carbonOracle;

    // Events
    event BondSeriesCreated(
        string indexed seriesId,
        uint256 faceValue,
        uint256 couponRate,
        uint256 totalSupply,
        uint256 maturityDate,
        uint256 carbonTarget
    );

    event BondsPurchased(
        string indexed seriesId,
        address indexed buyer,
        uint256 amount,
        uint256 cost
    );

    event CarbonReported(
        string indexed seriesId,
        uint256 carbonAchieved,
        uint256 achievementRate
    );

    event CouponPaid(
        string indexed seriesId,
        address indexed holder,
        uint256 amount,
        uint256 couponAmount
    );

    event BondRedeemed(
        string indexed seriesId,
        address indexed holder,
        uint256 amount,
        uint256 redemptionValue
    );

    event CouponRateAdjusted(
        string indexed seriesId,
        uint256 oldRate,
        uint256 newRate,
        uint256 carbonAchievementRate
    );

    constructor(address _carbonOracle) ERC20("Regenerative Coffee Bond", "RCB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        carbonOracle = _carbonOracle;
    }

    /**
     * @dev Create a new bond series
     */
    function createBondSeries(
        string memory seriesId,
        uint256 faceValue,
        uint256 couponRate,
        uint256 totalSupply,
        uint256 maturityDate,
        uint256 couponFrequency,
        uint256 carbonTarget
    ) external onlyRole(ISSUER_ROLE) {
        require(bondSeries[seriesId].faceValue == 0, "Series already exists");
        require(faceValue > 0, "Invalid face value");
        require(couponRate <= 2000, "Coupon rate too high"); // Max 20%
        require(totalSupply > 0, "Invalid total supply");
        require(maturityDate > block.timestamp, "Invalid maturity date");
        require(carbonTarget > 0, "Invalid carbon target");

        bondSeries[seriesId] = BondSeries({
            seriesId: seriesId,
            faceValue: faceValue,
            couponRate: couponRate,
            totalSupply: totalSupply,
            issuedAmount: 0,
            maturityDate: maturityDate,
            couponFrequency: couponFrequency,
            lastCouponDate: block.timestamp,
            carbonTarget: carbonTarget,
            carbonAchieved: 0,
            active: true,
            matured: false
        });

        emit BondSeriesCreated(
            seriesId,
            faceValue,
            couponRate,
            totalSupply,
            maturityDate,
            carbonTarget
        );
    }

    /**
     * @dev Purchase bonds from a series
     */
    function purchaseBonds(string memory seriesId, uint256 amount) 
        external payable nonReentrant {
        BondSeries storage series = bondSeries[seriesId];
        require(series.active, "Series not active");
        require(!series.matured, "Series matured");
        require(series.issuedAmount + amount <= series.totalSupply, "Exceeds supply");
        
        uint256 cost = (amount * series.faceValue) / 1e18;
        require(msg.value >= cost, "Insufficient payment");

        series.issuedAmount += amount;
        
        BondHolding storage holding = holdings[msg.sender][seriesId];
        if (holding.amount == 0) {
            holding.seriesId = seriesId;
            holding.purchaseDate = block.timestamp;
            userSeries[msg.sender].push(seriesId);
        }
        holding.amount += amount;
        holding.lastClaimedCoupon = series.lastCouponDate;

        _mint(msg.sender, amount);

        // Refund excess payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit BondsPurchased(seriesId, msg.sender, amount, cost);
    }

    /**
     * @dev Report carbon sequestration achievement (oracle only)
     */
    function reportCarbon(string memory seriesId, uint256 carbonAchieved) 
        external onlyRole(ORACLE_ROLE) {
        BondSeries storage series = bondSeries[seriesId];
        require(series.active, "Series not active");
        
        series.carbonAchieved = carbonAchieved;
        uint256 achievementRate = (carbonAchieved * 10000) / series.carbonTarget;
        
        // Adjust coupon rate based on carbon performance
        uint256 oldRate = series.couponRate;
        uint256 newRate = calculateDynamicCouponRate(oldRate, achievementRate);
        series.couponRate = newRate;
        
        emit CarbonReported(seriesId, carbonAchieved, achievementRate);
        emit CouponRateAdjusted(seriesId, oldRate, newRate, achievementRate);
    }

    /**
     * @dev Calculate dynamic coupon rate based on carbon performance
     */
    function calculateDynamicCouponRate(uint256 baseRate, uint256 achievementRate) 
        public pure returns (uint256) {
        // Achievement rate is in basis points (10000 = 100%)
        if (achievementRate >= 10000) {
            // Bonus: +50 basis points (0.5%) for full achievement
            return baseRate + 50;
        } else if (achievementRate >= 8000) {
            // Base rate for 80-100%
            return baseRate;
        } else if (achievementRate >= 5000) {
            // Penalty: -25 basis points for 50-80%
            return baseRate > 25 ? baseRate - 25 : 0;
        } else {
            // Severe penalty: -50 basis points for <50%
            return baseRate > 50 ? baseRate - 50 : 0;
        }
    }

    /**
     * @dev Claim accrued coupon payments
     */
    function claimCoupon(string memory seriesId) external nonReentrant {
        BondSeries storage series = bondSeries[seriesId];
        BondHolding storage holding = holdings[msg.sender][seriesId];
        require(holding.amount > 0, "No bonds held");
        require(series.active, "Series not active");
        
        uint256 couponAmount = calculateAccruedCoupon(seriesId, msg.sender);
        require(couponAmount > 0, "No coupon accrued");
        
        holding.lastClaimedCoupon = block.timestamp;
        
        // Transfer coupon payment
        payable(msg.sender).transfer(couponAmount);
        
        emit CouponPaid(seriesId, msg.sender, holding.amount, couponAmount);
    }

    /**
     * @dev Calculate accrued coupon for a holder
     */
    function calculateAccruedCoupon(string memory seriesId, address holder) 
        public view returns (uint256) {
        BondSeries storage series = bondSeries[seriesId];
        BondHolding storage holding = holdings[holder][seriesId];
        
        if (holding.amount == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - holding.lastClaimedCoupon;
        uint256 couponPeriods = timeElapsed / series.couponFrequency;
        
        if (couponPeriods == 0) return 0;
        
        // Annual coupon rate applied per period
        uint256 annualCoupon = (holding.amount * series.faceValue * series.couponRate) / 10000;
        uint256 periodCoupon = (annualCoupon * couponPeriods * series.couponFrequency) / 365 days;
        
        return periodCoupon / 1e18;
    }

    /**
     * @dev Redeem bonds at maturity
     */
    function redeemBonds(string memory seriesId, uint256 amount) external nonReentrant {
        BondSeries storage series = bondSeries[seriesId];
        BondHolding storage holding = holdings[msg.sender][seriesId];
        
        require(series.matured || block.timestamp >= series.maturityDate, "Not matured");
        require(holding.amount >= amount, "Insufficient balance");
        
        // Claim any remaining coupon first
        uint256 accruedCoupon = calculateAccruedCoupon(seriesId, msg.sender);
        if (accruedCoupon > 0) {
            holding.lastClaimedCoupon = block.timestamp;
            payable(msg.sender).transfer(accruedCoupon);
        }
        
        // Calculate redemption value with carbon performance bonus
        uint256 baseValue = (amount * series.faceValue) / 1e18;
        uint256 carbonBonus = calculateCarbonBonus(seriesId, amount);
        uint256 redemptionValue = baseValue + carbonBonus;
        
        holding.amount -= amount;
        _burn(msg.sender, amount);
        
        payable(msg.sender).transfer(redemptionValue);
        
        emit BondRedeemed(seriesId, msg.sender, amount, redemptionValue);
    }

    /**
     * @dev Calculate carbon performance bonus at redemption
     */
    function calculateCarbonBonus(string memory seriesId, uint256 amount) 
        public view returns (uint256) {
        BondSeries storage series = bondSeries[seriesId];
        
        if (series.carbonAchieved >= series.carbonTarget) {
            // 5% bonus for achieving carbon target
            return (amount * series.faceValue * 500) / 10000 / 1e18;
        } else if (series.carbonAchieved * 100 >= series.carbonTarget * 80) {
            // 2% bonus for 80%+ achievement
            return (amount * series.faceValue * 200) / 10000 / 1e18;
        }
        
        return 0;
    }

    /**
     * @dev Mature a bond series (issuer only)
     */
    function matureSeries(string memory seriesId) external onlyRole(ISSUER_ROLE) {
        BondSeries storage series = bondSeries[seriesId];
        require(series.active, "Series not active");
        require(block.timestamp >= series.maturityDate, "Not mature yet");
        
        series.active = false;
        series.matured = true;
    }

    /**
     * @dev Get all series IDs held by an address
     */
    function getUserSeries(address user) external view returns (string[] memory) {
        return userSeries[user];
    }

    /**
     * @dev Get holding details for a user and series
     */
    function getHolding(address user, string memory seriesId) 
        external view returns (BondHolding memory) {
        return holdings[user][seriesId];
    }

    /**
     * @dev Get bond series details
     */
    function getBondSeries(string memory seriesId) 
        external view returns (BondSeries memory) {
        return bondSeries[seriesId];
    }

    /**
     * @dev Withdraw funds (issuer only)
     */
    function withdrawFunds(address to, uint256 amount) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid address");
        payable(to).transfer(amount);
    }

    /**
     * @dev Set carbon oracle address
     */
    function setCarbonOracle(address newOracle) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        carbonOracle = newOracle;
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
```
