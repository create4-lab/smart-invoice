// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SmartInvoiceController.sol";

contract ControllerFactory {

    address public template;

    constructor(address _template) {
        template = _template;
    }

    function createController(address[] calldata receivers) external {
        // TODO: change on proxy
        SmartInvoiceController controller = new SmartInvoiceController(template, receivers);
        controller.transferOwnership(msg.sender);
    }

}
