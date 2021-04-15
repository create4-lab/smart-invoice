const TokenContract = artifacts.require("Token");

const { BN } = require("@openzeppelin/test-helpers");

const TOKEN_NUMBER = 1;
const USER_NUMBER = 1;
const DEPOSIT_AMOUNT = web3.utils.toWei("1", "ether");

contract("Basic scenario", ([user, receiver, ...temporaryAddresses]) => {
  let tokens = [],
    TokenAddresses = [];

  before("Init contracts", async () => {
    for (let i = 0; i < TOKEN_NUMBER; i++) {
      const token = await TokenContract.new();
      tokens.push(token);
      TokenAddresses.push(token.address);
    }
  });

  describe(`withdraw ${TOKEN_NUMBER} types of tokens and ether from ${USER_NUMBER} users`, () => {
    it("Users should have funds", async () => {
      for (let i = 0; i < USER_NUMBER; i++) {
        for (token of tokens) {
          await token.mint(user, DEPOSIT_AMOUNT);
        }
      }
    });

    it("Users should deposit ethers", async () => {
      for (let i = 0; i < USER_NUMBER; i++) {
        await web3.eth.sendTransaction({
          from: user,
          to: temporaryAddresses[i],
          value: DEPOSIT_AMOUNT,
        });
      }
    });

    it("Users should deposit funds", async () => {
      for (let i = 0; i < USER_NUMBER; i++) {
        for (token of tokens) {
          await token.transfer(temporaryAddresses[i], DEPOSIT_AMOUNT, {
            from: user,
          });
        }
      }
    });

    it("Service should withdraw funds", async () => {
      for (let i = 0; i < USER_NUMBER; i++) {
        for (token of tokens) {
          await token.transfer(receiver, DEPOSIT_AMOUNT, {
            from: temporaryAddresses[i],
          });
        }
        await web3.eth.sendTransaction({
          from: temporaryAddresses[i],
          to: receiver,
          value: DEPOSIT_AMOUNT,
        });
      }
    });
  });
});
