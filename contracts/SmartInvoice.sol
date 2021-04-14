// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISmartInvoice {
    function withdraw(address[] calldata tokens, address payable _receiver) external;
    function withdrawInTwo(address[] calldata tokens, address tokenReceiver, address payable ethReceiver) external;
    function withdrawInMany(address[] calldata tokens, address[] calldata receivers) external;
    function initialize() external;
}

contract SmartInvoice is ISmartInvoice {

    address private _controller;

    function initialize() external override {
        _controller = msg.sender;
    }

    function withdraw(address[] calldata tokens, address payable receiver) external override {
        require(msg.sender == _controller, "Sender is not the controller");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            if (address(token) == address(0)) {
                continue;
            }
            token.transfer(receiver, token.balanceOf(address(this)));
        }
        receiver.transfer(address(this).balance);
    }

    function withdrawInTwo(address[] calldata tokens, address tokenReceiver, address payable ethReceiver) external override {
        require(msg.sender == _controller, "Sender is not the controller");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            if (address(token) == address(0)) {
                continue;
            }
            token.transfer(tokenReceiver, token.balanceOf(address(this)));
        }
        ethReceiver.transfer(address(this).balance);
    }

    function withdrawInMany(address[] calldata tokens, address[] calldata receivers) external override {
        require(msg.sender == _controller, "Sender is not the controller");
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            if (address(token) == address(0)) {
                payable (receivers[i]).transfer(address(this).balance);
            }
            token.transfer(receivers[i], token.balanceOf(address(this)));
        }
    }

    receive() external payable {}
}
