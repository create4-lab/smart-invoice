const TokenContract = artifacts.require("Token");

const { BN } = require("@openzeppelin/test-helpers");

contract("Basic scenario", ([user, receiver, ...temporaryAddresses]) => {
  let tokens = [],
    TokenAddresses = [];
  const tokenNumber = 1;
  const userNumber = 1;
  const depositAmount = web3.utils.toWei("1", "ether");

  before("Init contracts", async () => {
    for (let i = 0; i < tokenNumber; i++) {
      const token = await TokenContract.new();
      tokens.push(token);
      TokenAddresses.push(token.address);
    }
  });

  describe(`withdraw ${tokenNumber} types of tokens and ether from ${userNumber} users`, () => {
    it("Users should have funds", async () => {
      for (let i = 0; i < userNumber; i++) {
        for (token of tokens) {
          await token.mint(user, depositAmount);
        }
      }
    });

    it("Users should deposit ethers", async () => {
      for (let i = 0; i < userNumber; i++) {
        await web3.eth.sendTransaction({
          from: user,
          to: temporaryAddresses[i],
          value: depositAmount,
        });
      }
    });

    it("Users should deposit funds", async () => {
      for (let i = 0; i < userNumber; i++) {
        for (token of tokens) {
          await token.transfer(temporaryAddresses[i], depositAmount, {
            from: user,
          });
        }
      }
    });

    it("Service should withdraw funds", async () => {
      for (let i = 0; i < userNumber; i++) {
        for (token of tokens) {
          await token.transfer(receiver, depositAmount, {
            from: temporaryAddresses[i],
          });
        }
        await web3.eth.sendTransaction({
          from: temporaryAddresses[i],
          to: receiver,
          value: depositAmount,
        });
      }
    });
  });
});
