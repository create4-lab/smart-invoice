const SmartInvoiceController = artifacts.require("SmartInvoiceController");
const TokenContract = artifacts.require("Token");

const { BN } = require("@openzeppelin/test-helpers");

contract(
  "SmartInvoiceController contract",
  ([owner, user, receiver, ...temporaryAddresses]) => {
    ETHERS = true;
    const DEPOSIT_AMOUNT = web3.utils.toWei("1", "wei");

    const testCases_1 = [
      {
        TOKEN_NUMBER: 1,
        USER_NUMBER: 1,
      },
      {
        TOKEN_NUMBER: 1,
        USER_NUMBER: 2,
      },
      {
        TOKEN_NUMBER: 1,
        USER_NUMBER: 4,
      },
      {
        TOKEN_NUMBER: 2,
        USER_NUMBER: 1,
      },
      {
        TOKEN_NUMBER: 2,
        USER_NUMBER: 2,
      },
      {
        TOKEN_NUMBER: 2,
        USER_NUMBER: 4,
      },
      {
        TOKEN_NUMBER: 3,
        USER_NUMBER: 1,
      },
      {
        TOKEN_NUMBER: 3,
        USER_NUMBER: 2,
      },
      {
        TOKEN_NUMBER: 3,
        USER_NUMBER: 4,
      },
    ];

    const testCases = [
      {
        TOKEN_NUMBER: 2,
        USER_NUMBER: 5,
      },
    ];
    const testResults = {};
    describe("", () => {
      after(() => {
        console.table(testResults);
      });
      testCases.forEach((testcase) => {
        describe(`Tokens:${testcase.TOKEN_NUMBER} Users: ${testcase.USER_NUMBER} Ethers: ${ETHERS}`, () => {
          let testResult = {};
          let Controller,
            tokens = [],
            tokenAddresses = [],
            userIds = [],
            invoices = [];

          before("Init contracts", async () => {
            Controller = await SmartInvoiceController.deployed();
            for (let i = 0; i < testcase.TOKEN_NUMBER; i++) {
              const token = await TokenContract.new();
              tokenAddresses.push(token.address);
              tokens.push(token);
              // Receiver should have non-zero balance
              await token.mint(receiver, "1");
            }

            userIds = [];
            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              userIds.push(web3.utils.randomHex(32));
            }
            await Controller.addReceiver(receiver);
          });

          after(() => {
            testResults[
              `T:${testcase.TOKEN_NUMBER} U:${testcase.USER_NUMBER}`
            ] = testResult;
          });

          it("Users should have funds", async () => {
            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              for (token of tokens) {
                await token.mint(user, DEPOSIT_AMOUNT);
              }
            }
          });

          it("Users should deposit ether", async () => {
            if (ETHERS) {
              for (let i = 0; i < testcase.USER_NUMBER; i++) {
                await web3.eth.sendTransaction({
                  from: user,
                  to: invoices[i],
                  value: DEPOSIT_AMOUNT,
                });
              }
            }
          });

          it("Users should deposit funds", async () => {
            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              for (token of tokens) {
                await token.transfer(temporaryAddresses[i], DEPOSIT_AMOUNT, {
                  from: user,
                });
              }
            }
          });

          it("Service should withdraw tokens", async () => {
            let totalGasUsed = 0;
            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              for (token of tokens) {
                const tx = await token.transfer(receiver, DEPOSIT_AMOUNT, {
                  from: temporaryAddresses[i],
                });
                totalGasUsed += tx.receipt.gasUsed;
              }
            }

            if (ETHERS) {
              for (let i = 0; i < testcase.USER_NUMBER; i++) {
                const tx = await web3.eth.sendTransaction({
                  from: temporaryAddresses[i],
                  to: receiver,
                  value: DEPOSIT_AMOUNT,
                });
                totalGasUsed += tx.gasUsed;
              }
            }

            testResult["basicGasUsed"] = totalGasUsed;
          });

          it("Should calculate wallet address", async () => {
            invoices = [];

            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              const invoiceAddress = await Controller.computeAddress.call(
                userIds[i]
              );
              invoices.push(invoiceAddress);
            }
          });

          it("Users should have funds", async () => {
            for (token of tokens) {
              await token.mint(
                user,
                new BN(DEPOSIT_AMOUNT).mul(new BN(testcase.USER_NUMBER))
              );
            }
          });

          it("Users should deposit ether", async () => {
            if (ETHERS) {
              for (let i = 0; i < testcase.USER_NUMBER; i++) {
                await web3.eth.sendTransaction({
                  from: user,
                  to: invoices[i],
                  value: DEPOSIT_AMOUNT,
                });
              }
            }
          });

          it("Users should deposit tokens", async () => {
            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              for (token of tokens) {
                await token.transfer(invoices[i], DEPOSIT_AMOUNT, {
                  from: user,
                });
              }
            }
          });

          it("Should withdraw funds to receiver", async () => {
            const tx = await Controller.withdrawInOne(
              userIds,
              tokenAddresses,
              receiver
            );
            testResult["firstWithdraw"] = tx.receipt.gasUsed;
          });

          it("Should calculate wallet address", async () => {
            invoices = [];

            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              const invoiceAddress = await Controller.computeAddress.call(
                userIds[i]
              );
              invoices.push(invoiceAddress);
            }
          });

          it("Users should have funds", async () => {
            for (token of tokens) {
              await token.mint(
                user,
                new BN(DEPOSIT_AMOUNT).mul(new BN(testcase.USER_NUMBER))
              );
            }
          });

          it("Users should deposit ether", async () => {
            if (ETHERS) {
              for (let i = 0; i < testcase.USER_NUMBER; i++) {
                await web3.eth.sendTransaction({
                  from: user,
                  to: invoices[i],
                  value: DEPOSIT_AMOUNT,
                });
              }
            }
          });

          it("Users should deposit tokens", async () => {
            for (let i = 0; i < testcase.USER_NUMBER; i++) {
              for (token of tokens) {
                await token.transfer(invoices[i], DEPOSIT_AMOUNT, {
                  from: user,
                });
              }
            }
          });

          it("Should withdraw funds to receiver", async () => {
            const tx = await Controller.withdrawInOne(
              userIds,
              tokenAddresses,
              receiver
            );
            testResult["secondWithdraw"] = tx.receipt.gasUsed;
          });
        });
      });
    });
  }
);
