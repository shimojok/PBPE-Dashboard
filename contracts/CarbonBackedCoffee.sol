// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CarbonBackedCoffee
 * @dev ERC721 token representing carbon-sequestering coffee with embedded climate value
 */
contract CarbonBackedCoffee is ERC721, AccessControl, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct CarbonMetadata {
        uint256 carbonSequestered;      // kgCO₂e
        uint256 coffeeYield;            // kg
        uint256 qualityScore;           // cupping score × 10
        uint256 timestamp;
        string originFarm;
        string verificationHash;        // SafelyChain proof hash
    }

    mapping(uint256 => CarbonMetadata) public tokenMetadata;
    mapping(string => bool) public usedVerificationHashes;

    // Carbon price oracle
    address public carbonPriceOracle;
    uint256 public currentCarbonPrice;  // USD per tCO₂e × 100

    // Events
    event CarbonTokenMinted(
        uint256 indexed tokenId,
        uint256 carbonSequestered,
        uint256 coffeeYield,
        address indexed minter
    );
    event CarbonPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event CarbonRetired(uint256 indexed tokenId, address retiredBy);

    constructor(address _carbonPriceOracle) ERC721("Carbon-Backed Coffee", "CBC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        carbonPriceOracle = _carbonPriceOracle;
    }

    /**
     * @dev Mint new Carbon-Backed Coffee token
     * @param to Recipient address
     * @param carbonSeq Carbon sequestered in kgCO₂e
     * @param yield_kg Coffee yield in kg
     * @param quality Quality score (×10)
     * @param farm Origin farm identifier
     * @param vHash SafelyChain verification hash
     */
    function mintCarbonBackedCoffee(
        address to,
        uint256 carbonSeq,
        uint256 yield_kg,
        uint256 quality,
        string memory farm,
        string memory vHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(carbonSeq >= 1000, "Carbon below minimum threshold"); // Min 1 tCO₂e
        require(yield_kg > 0, "Invalid yield");
        require(!usedVerificationHashes[vHash], "Hash already used");
        require(bytes(farm).length > 0, "Farm identifier required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        tokenMetadata[tokenId] = CarbonMetadata({
            carbonSequestered: carbonSeq,
            coffeeYield: yield_kg,
            qualityScore: quality,
            timestamp: block.timestamp,
            originFarm: farm,
            verificationHash: vHash
        });

        usedVerificationHashes[vHash] = true;
        _safeMint(to, tokenId);

        emit CarbonTokenMinted(tokenId, carbonSeq, yield_kg, msg.sender);
        return tokenId;
    }

    /**
     * @dev Calculate embedded carbon value in USD
     */
    function getCarbonValue(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        CarbonMetadata memory meta = tokenMetadata[tokenId];
        // carbonSeq (kg) × price (USD/t × 100) / 1000 / 100
        return (meta.carbonSequestered * currentCarbonPrice) / 100000;
    }

    /**
     * @dev Calculate total token value (coffee + carbon)
     */
    function getTotalValue(uint256 tokenId, uint256 coffeePricePerKg) 
        public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        CarbonMetadata memory meta = tokenMetadata[tokenId];
        uint256 coffeeValue = meta.coffeeYield * coffeePricePerKg;
        uint256 carbonValue = getCarbonValue(tokenId);
        uint256 qualityPremium = meta.qualityScore * coffeePricePerKg / 100;
        return coffeeValue + carbonValue + qualityPremium;
    }

    /**
     * @dev Retire carbon credits (permanent removal)
     */
    function retireCarbon(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
        emit CarbonRetired(tokenId, msg.sender);
    }

    /**
     * @dev Update carbon price from oracle
     */
    function updateCarbonPrice(uint256 newPrice) external {
        require(msg.sender == carbonPriceOracle, "Only oracle can update");
        uint256 oldPrice = currentCarbonPrice;
        currentCarbonPrice = newPrice;
        emit CarbonPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Batch mint for multiple tokens
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata carbonSeqs,
        uint256[] calldata yields,
        uint256[] calldata qualities,
        string[] calldata farms,
        string[] calldata vHashes
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256[] memory) {
        require(
            recipients.length == carbonSeqs.length &&
            carbonSeqs.length == yields.length &&
            yields.length == qualities.length &&
            qualities.length == farms.length &&
            farms.length == vHashes.length,
            "Array length mismatch"
        );

        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintCarbonBackedCoffee(
                recipients[i],
                carbonSeqs[i],
                yields[i],
                qualities[i],
                farms[i],
                vHashes[i]
            );
        }
        
        return tokenIds;
    }

    /**
     * @dev Get all metadata for a token
     */
    function getTokenMetadata(uint256 tokenId) 
        external view returns (CarbonMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenMetadata[tokenId];
    }

    /**
     * @dev Check if verification hash has been used
     */
    function isVerificationHashUsed(string memory vHash) 
        external view returns (bool) {
        return usedVerificationHashes[vHash];
    }

    // Override required functions
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setCarbonPriceOracle(address newOracle) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        carbonPriceOracle = newOracle;
    }
}
