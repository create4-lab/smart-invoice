const SmartInvoiceController = artifacts.require("SmartInvoiceController");
const SmartInvoice = artifacts.require("SmartInvoice");
const TokenContract = artifacts.require("Token");

const { BN, constants, expectRevert } = require("@openzeppelin/test-helpers");

contract(
  "SmartInvoiceController contract",
  ([owner, user, receiver, hacker]) => {
    let Controller,
      tokens = [],
      tokenAddresses = [],
      userIds = [],
      invoices = [];

    const tokenNumber = 3;
    const userNumber = 10;
    const depositAmount = web3.utils.toWei("1", "ether");

    before("Init contracts", async () => {
      Controller = await SmartInvoiceController.deployed();
      for (let i = 0; i < tokenNumber; i++) {
        const token = await TokenContract.new();
        tokenAddresses.push(token.address);
        tokens.push(token);
      }
    });

    describe(`Withdraw ethers from ${userNumber} invoices to the receiver`, () => {
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < userNumber; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });

      it("Owner should add receiver", async () => {
        await Controller.addReceiver(receiver, { from: owner });
      });

      it("Should compute invoices addresses", async () => {
        invoices = [];
        for (let i = 0; i < userNumber; i++) {
          const invoiceAddress = await Controller.computeAddress.call(
            userIds[i]
          );
          invoices.push(invoiceAddress);
        }
      });

      it("User should deposit ethers", async () => {
        for (let i = 0; i < userNumber; i++) {
          await web3.eth.sendTransaction({
            from: user,
            to: invoices[i],
            value: depositAmount,
          });
        }
      });

      it("Should get invoices ETH total balance", async () => {
        const balance = await Controller.getBalance.call(
          userIds,
          constants.ZERO_ADDRESS
        );
        assert.equal(
          balance.toString(),
          new BN(depositAmount).mul(new BN(userNumber)).toString()
        );
      });

      it("Should withdraw funds to receiver", async () => {
        const prevBalance = await web3.eth.getBalance(receiver);
        await Controller.withdraw(userIds, tokenAddresses, receiver);
        const etherBalance = await web3.eth.getBalance(receiver);
        assert.equal(
          etherBalance.toString(),
          new BN(prevBalance)
            .add(new BN(depositAmount).mul(new BN(userNumber)))
            .toString()
        );
      });
    });

    describe(`Withdraw ${tokenNumber} types of tokens from ${userNumber} invoices to the receiver with zero tokens balances`, () => {
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < userNumber; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });

      it("Should calculate wallet address", async () => {
        invoices = [];
        for (let i = 0; i < userNumber; i++) {
          const invoiceAddress = await Controller.computeAddress.call(
            userIds[i]
          );
          invoices.push(invoiceAddress);
        }
      });

      it("Users should have funds", async () => {
        for (token of tokens) {
          await token.mint(user, new BN(depositAmount).mul(new BN(userNumber)));
        }
      });

      it("Users should deposit ether", async () => {
        for (let i = 0; i < userNumber; i++) {
          await web3.eth.sendTransaction({
            from: user,
            to: invoices[i],
            value: depositAmount,
          });
        }
      });

      it("Users should deposit tokens", async () => {
        for (let i = 0; i < userNumber; i++) {
          for (token of tokens) {
            await token.transfer(invoices[i], depositAmount, { from: user });
          }
        }
      });

      it("Should get invoices ETH total balance", async () => {
        const balance = await Controller.getBalance.call(
          userIds,
          constants.ZERO_ADDRESS
        );
        assert.equal(
          balance.toString(),
          new BN(depositAmount).mul(new BN(userNumber)).toString()
        );
      });

      it("Should get invoices tokens total balance", async () => {
        for (token of tokens) {
          const balance = await Controller.getBalance.call(
            userIds,
            token.address
          );
          assert.equal(
            balance.toString(),
            new BN(depositAmount).mul(new BN(userNumber)).toString()
          );
        }
      });

      it("Should withdraw funds to receiver", async () => {
        const prevBalance = await web3.eth.getBalance(receiver);
        let prevTokenBalances = {};
        for (token of tokens) {
          const bal = await token.balanceOf(receiver);
          prevTokenBalances[token.address] = bal;
        }
        await Controller.withdraw(userIds, tokenAddresses, receiver);

        for (token of tokens) {
          const bal = await token.balanceOf(receiver);
          assert.equal(
            bal.toString(),
            new BN(prevTokenBalances[token.address])
              .add(new BN(depositAmount).mul(new BN(userNumber)))
              .toString()
          );
        }
        const etherBalance = await web3.eth.getBalance(receiver);
        assert.equal(
          etherBalance,
          new BN(prevBalance)
            .add(new BN(depositAmount).mul(new BN(userNumber)))
            .toString()
        );
      });
    });

    describe(`First and second withdraws`, async () => {
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < userNumber; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });
      describe(`First withdraw ${tokenNumber} types of tokens from ${userNumber} invoices to the receiver with zero tokens balances`, () => {
        it("Should calculate wallet address", async () => {
          invoices = [];

          for (let i = 0; i < userNumber; i++) {
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
              new BN(depositAmount).mul(new BN(userNumber))
            );
          }
        });

        it("Users should deposit ether", async () => {
          for (let i = 0; i < userNumber; i++) {
            await web3.eth.sendTransaction({
              from: user,
              to: invoices[i],
              value: depositAmount,
            });
          }
        });

        it("Users should deposit tokens", async () => {
          for (let i = 0; i < userNumber; i++) {
            for (token of tokens) {
              await token.transfer(invoices[i], depositAmount, {
                from: user,
              });
            }
          }
        });

        it("Should get invoices ETH total balance", async () => {
          const balance = await Controller.getBalance.call(
            userIds,
            constants.ZERO_ADDRESS
          );
          assert.equal(
            balance.toString(),
            new BN(depositAmount).mul(new BN(userNumber)).toString()
          );
        });

        it("Should get invoices tokens total balance", async () => {
          for (token of tokens) {
            const balance = await Controller.getBalance.call(
              userIds,
              token.address
            );
            assert.equal(
              balance.toString(),
              new BN(depositAmount).mul(new BN(userNumber)).toString()
            );
          }
        });

        it("Should withdraw funds to receiver", async () => {
          const prevBalance = await web3.eth.getBalance(receiver);
          let prevTokenBalances = {};
          for (token of tokens) {
            const bal = await token.balanceOf(receiver);
            prevTokenBalances[token.address] = bal;
          }
          await Controller.withdraw(userIds, tokenAddresses, receiver);

          for (token of tokens) {
            const bal = await token.balanceOf(receiver);
            assert.equal(
              bal.toString(),
              new BN(prevTokenBalances[token.address])
                .add(new BN(depositAmount).mul(new BN(userNumber)))
                .toString()
            );
          }
          const etherBalance = await web3.eth.getBalance(receiver);
          assert.equal(
            etherBalance,
            new BN(prevBalance)
              .add(new BN(depositAmount).mul(new BN(userNumber)))
              .toString()
          );
        });
      });
      describe(`Second Withdraw ${tokenNumber} types of tokens from ${userNumber} invoices to the receiver with zero tokens balances`, () => {
        it("Should calculate wallet address", async () => {
          invoices = [];

          for (let i = 0; i < userNumber; i++) {
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
              new BN(depositAmount).mul(new BN(userNumber))
            );
          }
        });

        it("Users should deposit ether", async () => {
          for (let i = 0; i < userNumber; i++) {
            await web3.eth.sendTransaction({
              from: user,
              to: invoices[i],
              value: depositAmount,
            });
          }
        });

        it("Users should deposit tokens", async () => {
          for (let i = 0; i < userNumber; i++) {
            for (token of tokens) {
              await token.transfer(invoices[i], depositAmount, {
                from: user,
              });
            }
          }
        });

        it("Should get invoices ETH total balance", async () => {
          const balance = await Controller.getBalance.call(
            userIds,
            constants.ZERO_ADDRESS
          );
          assert.equal(
            balance.toString(),
            new BN(depositAmount).mul(new BN(userNumber)).toString()
          );
        });

        it("Should get invoices tokens total balance", async () => {
          for (token of tokens) {
            const balance = await Controller.getBalance.call(
              userIds,
              token.address
            );
            assert.equal(
              balance.toString(),
              new BN(depositAmount).mul(new BN(userNumber)).toString()
            );
          }
        });

        it("Should not withdraw funds", async () => {
          for (let i = 0; i < invoices.length; i++) {
            const account = await SmartInvoice.at(invoices[i]);
            await expectRevert(
              account.withdraw(tokenAddresses, hacker, { from: hacker }),
              "Sender is not the controller"
            );
          }
        });

        it("Should withdraw funds to receiver", async () => {
          const prevBalance = await web3.eth.getBalance(receiver);
          let prevTokenBalances = {};

          for (token of tokens) {
            const balance = await token.balanceOf(receiver);
            prevTokenBalances[token.address] = balance;
          }

          await Controller.withdraw(userIds, tokenAddresses, receiver);

          for (token of tokens) {
            const bal = await token.balanceOf(receiver);
            assert.equal(
              bal.toString(),
              new BN(prevTokenBalances[token.address])
                .add(new BN(depositAmount).mul(new BN(userNumber)))
                .toString()
            );
          }
          const etherBalance = await web3.eth.getBalance(receiver);
          assert.equal(
            etherBalance,
            new BN(prevBalance).add(
              new BN(depositAmount).mul(new BN(userNumber))
            )
          );
        });
      });
    });
  }
);
