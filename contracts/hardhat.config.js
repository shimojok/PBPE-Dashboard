echo 'require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};' > hardhat.config.js