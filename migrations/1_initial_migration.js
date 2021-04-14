const SmartInvoiceController = artifacts.require("SmartInvoiceController");
const SmartInvoice = artifacts.require("SmartInvoice");

module.exports = function (deployer) {
  deployer.then(async () => {
    await deployer.deploy(SmartInvoice);
    const template = await SmartInvoice.deployed();
    await deployer.deploy(SmartInvoiceController, template.address, []);
  });
};
