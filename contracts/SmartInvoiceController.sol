// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ISmartInvoice, IController } from "./Interfaces.sol";


contract SmartInvoiceController is IController,  Ownable {

    mapping (address => bool) public whitelist;
    address public invoiceTemplate;

/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
/// @param newInvoiceTemplate The address of new invoice template
/// @param receivers The array of receivers which will be added to the whitelist
    constructor(address newInvoiceTemplate, address[] memory receivers) {
        setInvoiceTemplate(newInvoiceTemplate);
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
    function withdrawInOne(
        uint256[] calldata ids,
        address[] calldata tokens,
        address payable receiver
    )
        external
        override
    {
        require(isWhitelisted(receiver), "Receiver is not whilisted");
        for(uint256 i = 0; i < ids.length; i++) {
            ISmartInvoice invoice = _getInvoiceInstance(ids[i]);
            invoice.withdrawInOne(tokens, receiver);
        }
    }

    /// @notice Witdraws erc20 tokens and ether from invoices and send it to two receivers
    /// @param ids The array of users ids
    /// @param tokens The address of the erc20 token which will be withdrawed. For Ether use empty array or [0]
    /// @param tokenReceiver The address which will get tokens
    /// @param ethReceiver The address which will get ethers
    function withdrawInTwo(
        uint256[] calldata ids,
        address[] calldata tokens,
        address tokenReceiver,
        address payable ethReceiver
    )
        external
        override
    {
        require(
            isWhitelisted(tokenReceiver) &&
            isWhitelisted(ethReceiver),
            "Receiver is not whilisted"
        );
        for(uint256 i = 0; i < ids.length; i++) {
            ISmartInvoice invoice = _getInvoiceInstance(ids[i]);
            invoice.withdrawInTwo(tokens, tokenReceiver, ethReceiver);
        }
    }

    /// @notice Witdraws erc20 tokens and ether from invoices and send it to receivers
    /// @param ids The array of users ids
    /// @param tokens The array of token addresses which will be withdrawed. For Ether use empty array or [0]
    /// @param receivers The array of receivers which will get tokens
    function withdrawInMany(
        uint256[] calldata ids,
        address[] calldata tokens,
        address[] calldata receivers
    )
        external
        override
    {
        for (uint256 j = 0; j < receivers.length; j++) {
            require(isWhitelisted(receivers[j]), "Receiver is not whilisted");
        }
        for(uint256 i = 0; i < ids.length; i++) {
            ISmartInvoice invoice = _getInvoiceInstance(ids[i]);
            invoice.withdrawInMany(tokens, receivers);
        }
    }

    /// @notice Returns total balance of users invoices in the erc20 token
    /// @dev Explain to a developer any extra details
    /// @param ids Array of users ids
    /// @param token Address of the token. For ETH use ZERO_ADDRESS
    /// @return total The total balance of users invoices
    function getBalance(
        uint256[] calldata ids,
        address token
    )
        external
        view
        override
        returns(uint256 total)
    {
        for(uint256 i = 0; i < ids.length; i++) {
            total += _getBalance(ids[i], token);
        }
    }

    /// @notice Returns deposit address for user
    /// @param id The unique user sid
    /// @return address of the deposit account for user
    function computeAddress(
        uint256 id
    )
        external
        view
        override
        returns(address)
    {
        return Clones.predictDeterministicAddress(invoiceTemplate, bytes32(id));
    }

    /// @notice Adds a receiver address to the whitelist
    /// @param receiver The address which will be added to the whitelist and will be able to get funds
    function addReceiver(
        address receiver
    )
        public
        onlyOwner
        override
    {
        whitelist[receiver] = true;
        emit WhitelistUpdated(receiver, whitelist[receiver]);
    }

    /// @notice Removes a receiver address from the whitelist
    /// @param receiver The address which will be removed from the whitelist
    function removeReceiver(
        address receiver
    )
        external
        onlyOwner
        override
    {
        delete whitelist[receiver];
        emit WhitelistUpdated(receiver, whitelist[receiver]);
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param newTemplate The address of new invoice template
    function setInvoiceTemplate(
        address newTemplate
    )
        public
        onlyOwner
        override
    {
        require(isContract(newTemplate) == true, "Template has to be a contract");
        invoiceTemplate = newTemplate;
    }

    /// @notice Checks the address is whitelisted or not
    /// @param receiver The receiver address which will checked
    /// @return Result true if the receiver address in the whitelist
    function isWhitelisted(
        address receiver
    )
        public
        view
        override
        returns(bool)
    {
        return whitelist[receiver] == true;
    }

    function _getInvoiceInstance(
        uint256 salt
    )
        private
        returns(ISmartInvoice)
    {
        address invoice = Clones.predictDeterministicAddress(invoiceTemplate, bytes32(salt));

        if (!isContract(invoice)) {
            address instance = Clones.cloneDeterministic(invoiceTemplate, bytes32(salt));
            ISmartInvoice(instance).initialize();
        }

        return ISmartInvoice(invoice);
    }

    function _getBalance(
        uint256 salt,
        address token
    )
        private
        view
        returns(uint256)
    {
        address invoice = Clones.predictDeterministicAddress(invoiceTemplate, bytes32(salt));
        if (token == address(0)) {
            return invoice.balance;
        } else {
            return IERC20(token).balanceOf(invoice);
        }
    }

    function isContract(
        address invoiceAddress
    )
        private
        view
        returns (bool)
    {
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(invoiceAddress) }
        return size > 0;
    }

}
