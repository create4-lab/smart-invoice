const SmartInvoiceController = artifacts.require("SmartInvoiceController");
const SmartInvoice = artifacts.require("SmartInvoice");
const TokenContract = artifacts.require("Token");

const { BN, constants, expectRevert } = require("@openzeppelin/test-helpers");

const TOKEN_NUMBER = 3;
const USER_NUMBER = 1;
const DEPOSIT_AMOUNT = web3.utils.toWei("1", "ether");

contract(
  "SmartInvoiceController contract",
  ([owner, user, hacker, receiver, ...receivers]) => {
    let Controller,
      tokens = [],
      tokenAddresses = [],
      userIds = [],
      invoices = [];

    before("Init contracts", async () => {
      Controller = await SmartInvoiceController.deployed();
      for (let i = 0; i < TOKEN_NUMBER; i++) {
        const token = await TokenContract.new();
        tokenAddresses.push(token.address);
        tokens.push(token);
      }
    });

    describe(`Withdraw ethers from ${USER_NUMBER} invoices to the receiver`, () => {
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < USER_NUMBER; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });

      it("Owner should add receiver", async () => {
        await Controller.addReceiver(receiver, { from: owner });
      });

      it("Should compute invoices addresses", async () => {
        invoices = [];
        for (let i = 0; i < USER_NUMBER; i++) {
          const invoiceAddress = await Controller.computeAddress.call(
            userIds[i]
          );
          invoices.push(invoiceAddress);
        }
      });

      it("User should deposit ethers", async () => {
        for (let i = 0; i < USER_NUMBER; i++) {
          await web3.eth.sendTransaction({
            from: user,
            to: invoices[i],
            value: DEPOSIT_AMOUNT,
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
          new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
        );
      });

      it("Should withdraw funds to receiver", async () => {
        const prevBalance = await web3.eth.getBalance(receiver);
        await Controller.withdrawInOne(userIds, tokenAddresses, receiver);
        const etherBalance = await web3.eth.getBalance(receiver);
        assert.equal(
          etherBalance.toString(),
          new BN(prevBalance)
            .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
            .toString()
        );
      });
    });

    describe(`Withdraw ${TOKEN_NUMBER} types of tokens from ${USER_NUMBER} invoices to the receiver with zero tokens balances`, () => {
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < USER_NUMBER; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });

      it("Should calculate wallet address", async () => {
        invoices = [];
        for (let i = 0; i < USER_NUMBER; i++) {
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
            new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER))
          );
        }
      });

      it("Users should deposit ether", async () => {
        for (let i = 0; i < USER_NUMBER; i++) {
          await web3.eth.sendTransaction({
            from: user,
            to: invoices[i],
            value: DEPOSIT_AMOUNT,
          });
        }
      });

      it("Users should deposit tokens", async () => {
        for (let i = 0; i < USER_NUMBER; i++) {
          for (token of tokens) {
            await token.transfer(invoices[i], DEPOSIT_AMOUNT, { from: user });
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
          new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
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
            new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
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
        await Controller.withdrawInOne(userIds, tokenAddresses, receiver);

        for (token of tokens) {
          const bal = await token.balanceOf(receiver);
          assert.equal(
            bal.toString(),
            new BN(prevTokenBalances[token.address])
              .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
              .toString()
          );
        }
        const etherBalance = await web3.eth.getBalance(receiver);
        assert.equal(
          etherBalance,
          new BN(prevBalance)
            .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
            .toString()
        );
      });
    });

    describe(`First and second withdraws`, async () => {
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < USER_NUMBER; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });
      describe(`First withdraw ${TOKEN_NUMBER} types of tokens from ${USER_NUMBER} invoices to the receiver with zero tokens balances`, () => {
        it("Should calculate wallet address", async () => {
          invoices = [];

          for (let i = 0; i < USER_NUMBER; i++) {
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
              new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER))
            );
          }
        });

        it("Users should deposit ether", async () => {
          for (let i = 0; i < USER_NUMBER; i++) {
            await web3.eth.sendTransaction({
              from: user,
              to: invoices[i],
              value: DEPOSIT_AMOUNT,
            });
          }
        });

        it("Users should deposit tokens", async () => {
          for (let i = 0; i < USER_NUMBER; i++) {
            for (token of tokens) {
              await token.transfer(invoices[i], DEPOSIT_AMOUNT, {
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
            new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
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
              new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
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
          await Controller.withdrawInOne(userIds, tokenAddresses, receiver);

          for (token of tokens) {
            const bal = await token.balanceOf(receiver);
            assert.equal(
              bal.toString(),
              new BN(prevTokenBalances[token.address])
                .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
                .toString()
            );
          }
          const etherBalance = await web3.eth.getBalance(receiver);
          assert.equal(
            etherBalance,
            new BN(prevBalance)
              .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
              .toString()
          );
        });
      });
      describe(`Second Withdraw ${TOKEN_NUMBER} types of tokens from ${USER_NUMBER} invoices to the receiver with zero tokens balances`, () => {
        it("Should calculate wallet address", async () => {
          invoices = [];

          for (let i = 0; i < USER_NUMBER; i++) {
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
              new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER))
            );
          }
        });

        it("Users should deposit ether", async () => {
          for (let i = 0; i < USER_NUMBER; i++) {
            await web3.eth.sendTransaction({
              from: user,
              to: invoices[i],
              value: DEPOSIT_AMOUNT,
            });
          }
        });

        it("Users should deposit tokens", async () => {
          for (let i = 0; i < USER_NUMBER; i++) {
            for (token of tokens) {
              await token.transfer(invoices[i], DEPOSIT_AMOUNT, {
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
            new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
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
              new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
            );
          }
        });

        it("Should not withdraw funds", async () => {
          for (let i = 0; i < invoices.length; i++) {
            const account = await SmartInvoice.at(invoices[i]);
            await expectRevert(
              account.withdrawInOne(tokenAddresses, hacker, { from: hacker }),
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

          await Controller.withdrawInOne(userIds, tokenAddresses, receiver);

          for (token of tokens) {
            const bal = await token.balanceOf(receiver);
            assert.equal(
              bal.toString(),
              new BN(prevTokenBalances[token.address])
                .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
                .toString()
            );
          }
          const etherBalance = await web3.eth.getBalance(receiver);
          assert.equal(
            etherBalance,
            new BN(prevBalance).add(
              new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER))
            )
          );
        });
      });
    });

    describe(`Withdraw ${TOKEN_NUMBER} types of tokens from ${USER_NUMBER} invoices in two receivers`, () => {
      const ethReceiver = receivers[1];
      const tokenReceiver = receivers[2];
      before("Init users ids", () => {
        userIds = [];
        for (let i = 0; i < USER_NUMBER; i++) {
          userIds.push(web3.utils.randomHex(32));
        }
      });

      it("Should add receivers to the whitelist", async () => {
        await Controller.addReceiver(ethReceiver);
        await Controller.addReceiver(tokenReceiver);
      });

      it("Should calculate wallet address", async () => {
        invoices = [];
        for (let i = 0; i < USER_NUMBER; i++) {
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
            new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER))
          );
        }
      });

      it("Users should deposit ether", async () => {
        for (let i = 0; i < USER_NUMBER; i++) {
          await web3.eth.sendTransaction({
            from: user,
            to: invoices[i],
            value: DEPOSIT_AMOUNT,
          });
        }
      });

      it("Users should deposit tokens", async () => {
        for (let i = 0; i < USER_NUMBER; i++) {
          for (token of tokens) {
            await token.transfer(invoices[i], DEPOSIT_AMOUNT, { from: user });
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
          new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
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
            new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)).toString()
          );
        }
      });

      it("Should withdraw funds to receiver", async () => {
        const prevEthBalance = await web3.eth.getBalance(ethReceiver);
        let prevTokenBalances = {};
        for (token of tokens) {
          const tokenBalance = await token.balanceOf(tokenReceiver);
          prevTokenBalances[token.address] = tokenBalance;
        }
        await Controller.withdrawInTwo(
          userIds,
          tokenAddresses,
          tokenReceiver,
          ethReceiver
        );

        for (token of tokens) {
          const tokenBalance = await token.balanceOf(tokenReceiver);
          assert.equal(
            tokenBalance.toString(),
            new BN(prevTokenBalances[token.address])
              .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
              .toString()
          );
        }
        const etherBalance = await web3.eth.getBalance(ethReceiver);
        assert.equal(
          etherBalance,
          new BN(prevEthBalance)
            .add(new BN(DEPOSIT_AMOUNT).mul(new BN(USER_NUMBER)))
            .toString()
        );
      });
    });
  }
);
