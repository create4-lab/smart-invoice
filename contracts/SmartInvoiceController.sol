// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ISmartInvoice } from "./SmartInvoice.sol";


contract SmartInvoiceController is Ownable {

    mapping (address => bool) public whitelist;
    address public template;

    constructor(address _template, address[] memory receivers) {
        setAccountTemplate(_template);
        addReceiver(msg.sender);
        for (uint256 i = 0; i < receivers.length; i++) {
            addReceiver(msg.sender);
        }
    }

    event WhitelistUpdated(address receiver, bool added);

    /// @notice Witdraws erc20 tokens and ether from invoices and send it to the receiver
    /// @param ids The array of users ids
    /// @param tokens The address of the erc20 token which will be withdrawed. For Ether use empty array or [0]
    /// @param receiver The address which will get assets
    function withdraw(uint256[] calldata ids, address[] calldata tokens, address payable receiver) external {
        require(whitelist[receiver] == true, "Receiver is not whilisted");
        for(uint256 i = 0; i < ids.length; i++) {
            _withdraw(ids[i], tokens, receiver);
        }
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param ids Array of users ids
    /// @param token Address of the token. For ETH use 0
    /// @return total Total balance on invoices
    function getBalance(uint256[] calldata ids, address token) external view returns(uint256 total) {
        for(uint256 i = 0; i < ids.length; i++) {
            total += _getBalance(ids[i], token);
        }
    }

    /// @notice Returns deposit address for user
    /// @param id The unique user sid
    /// @return address of the deposit account for user
    function computeAddress(uint256 id) external view returns(address) {
        return Clones.predictDeterministicAddress(template, bytes32(id));
    }

    function addReceiver(address receiver) public onlyOwner {
        whitelist[receiver] = true;
        emit WhitelistUpdated(receiver, whitelist[receiver]);
    }

    function removeReceiver(address receiver) external onlyOwner {
        delete whitelist[receiver];
        emit WhitelistUpdated(receiver, whitelist[receiver]);
    }

    function setAccountTemplate(address newTemplate) public onlyOwner {
        require(isContract(newTemplate) == true, "Template has to be a contract");
        template = newTemplate;
    }

    function _withdraw(uint256 salt, address[] memory tokens, address payable receiver) private {
        address invoice = Clones.predictDeterministicAddress(template, bytes32(salt));

        if (!isContract(invoice)) {
            address inv = Clones.cloneDeterministic(template, bytes32(salt));
            ISmartInvoice(inv).initialize();
        }

        ISmartInvoice(invoice).withdraw(tokens, receiver);
    }

    function _getBalance(uint256 salt, address token) private view returns(uint256) {
        address invoice = Clones.predictDeterministicAddress(template, bytes32(salt));
        if (token == address(0)) {
            return invoice.balance;
        } else {
            return IERC20(token).balanceOf(invoice);
        }
    }

    function isContract(address account) private view returns (bool) {
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }

}
