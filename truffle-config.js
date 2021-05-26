const HDWalletProvider = require("@truffle/hdwallet-provider");

const MOCHA_CONFIG = process.env.GAS_REPORT
  ? {
      colors: true,
      reporter: "eth-gas-reporter",
      reporterOptions: {
        currency: "USD",
        coinmarketcap: "ac8f3c0d-787d-43fa-b102-c4c33aabcf5f",
        excludeContracts: ["Token", "Interfaces"],
      },
    }
  : {};

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [process.env.DEPLOYER_PRIVATE_KEY],
          providerOrUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
        }),
      network_id: 4,
      gas: 4000000,
      skipDryRun: true,
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [process.env.DEPLOYER_PRIVATE_KEY],
          providerOrUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
        }),
      network_id: 3, // Ropsten's id
      gas: 10000000, // Ropsten has a lower block limit than mainnet
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
    bsc_testnet: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [process.env.DEPLOYER_PRIVATE_KEY],
          providerOrUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
        }),
      network_id: 97,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters etc.

  mocha: MOCHA_CONFIG,

  // Configure your compilers
  compilers: {
    solc: {
      parser: "solcjs",
      version: "0.8.3",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  plugins: ["solidity-coverage"],
};
