// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ISmartInvoice } from "./Interfaces.sol";

contract SmartInvoice is ISmartInvoice {

    address private _controller;
    address private constant ETH_ADDRESS = address(0);

    /// @notice Makes msg.sender controllers
    /// @dev Instead of constructor use initialize()
    function initialize() external override {
        _controller = msg.sender;
    }

    modifier onlyController() {
        require(msg.sender == _controller, "Sender is not the controller");
        _;
    }

    /// @notice Send tokens and ethers to the receiver
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param receiver The address which will get all funds (tokens + ethers)
    function withdrawInOne(
        address[] calldata tokens,
        address payable receiver
    )
        external
        onlyController
        override
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            if (address(token) != ETH_ADDRESS) {
                token.transfer(receiver, token.balanceOf(address(this)));
            }
        }
        receiver.transfer(address(this).balance);
    }

    /// @notice Send tokens and ethers separataly to two receivers
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param tokenReceiver The address which will get all tokens
    /// @param ethReceiver The address which will get ethers
    function withdrawInTwo(
        address[] calldata tokens,
        address tokenReceiver,
        address payable ethReceiver
    )
        external
        onlyController
        override
    {
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            if (address(token) != ETH_ADDRESS) {
                token.transfer(tokenReceiver, token.balanceOf(address(this)));
            }
        }
        ethReceiver.transfer(address(this).balance);
    }

    /// @notice Send tokens and ethers to many receivers
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param receivers The array of addressess which will get tokens
    function withdrawInMany(
        address[] calldata tokens,
        address[] calldata receivers
    )
        external
        onlyController
        override
    {
        require(tokens.length == receivers.length, "Arrays have to have the same length");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            if (address(token) == ETH_ADDRESS) {
                payable (receivers[i]).transfer(address(this).balance);
            } else {
                token.transfer(receivers[i], token.balanceOf(address(this)));
            }
        }
    }

    /// @notice The receive function
    /// @dev This function do nothing for getting ethers
    receive() external payable {}
}
