// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISmartInvoice {
    /// @notice Send tokens and ethers to the receiver
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param receiver The address which will get all funds (tokens + ethers)
    function withdrawInOne(address[] calldata tokens, address payable receiver) external;

    /// @notice Send tokens and ethers separataly to two receivers
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param tokenReceiver The address which will get all tokens
    /// @param ethReceiver The address which will get ethers
    function withdrawInTwo(address[] calldata tokens, address tokenReceiver, address payable ethReceiver) external;

    /// @notice Send tokens and ethers to many receivers
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param receivers The array of addressess which will get tokens
    function withdrawInMany(address[] calldata tokens, address[] calldata receivers) external;

    /// @notice The receive function
    /// @dev This function do nothing for getting ethers
    function initialize() external;
}

interface IController {
    /// @notice Witdraws erc20 tokens and ether from invoices and send it to the receiver
    /// @param ids The array of users ids
    /// @param tokens The address of the erc20 token which will be withdrawed. For Ether use address[0]
    /// @param receiver The address which will get funds
    function withdrawInOne(uint256[] calldata ids, address[] calldata tokens, address payable receiver) external;

    /// @notice Send tokens and ethers separataly to two receivers
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param tokenReceiver The address which will get all tokens
    /// @param ethReceiver The address which will get ethers
    function withdrawInTwo(uint256[] calldata ids, address[] calldata tokens, address tokenReceiver, address payable ethReceiver) external;

    /// @notice Send tokens and ethers to many receivers
    /// @dev Only controller can call this method
    /// @param tokens The array of addressess of tokens which will be withdrawed
    /// @param receivers The array of addressess which will get tokens
    function withdrawInMany(uint256[] calldata ids, address[] calldata tokens, address[] calldata receivers) external;

    /// @notice Returns total balance of users invoices in the erc20 token
    /// @dev Explain to a developer any extra details
    /// @param ids Array of users ids
    /// @param token Address of the token. For ETH use ZERO_ADDRESS
    /// @return total The total balance of users invoices
    function getBalance(uint256[] calldata ids, address token) external view returns(uint256 total);

    /// @notice Returns deposit address for user
    /// @param id The unique user sid
    /// @return address of the deposit account for user
    function computeAddress(uint256 id) external view returns(address);

    /// @notice Adds a receiver address to the whitelist
    /// @dev Only owner can do it
    /// @param receiver The address which will be added to the whitelist and will be able to get funds
    function addReceiver(address receiver) external;

    /// @notice Removes a receiver address from the whitelist
    /// @dev Only owner can do it
    /// @param receiver The address which will be removed from the whitelist
    function removeReceiver(address receiver) external;

    /// @notice Explain to an end user what this does
    /// @dev Only owner can do it
    /// @dev Explain to a developer any extra details
    /// @param newTemplate The address of new invoice template
    function setInvoiceTemplate(address newTemplate) external;

    /// @notice Checks the address is whitelisted or not
    /// @param receiver The receiver address which will checked
    /// @return Result true if the receiver address in the whitelist
    function isWhitelisted(address receiver) external view returns(bool);
}
