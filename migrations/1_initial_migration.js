var Migrations = artifacts.require("./Migrations.sol");
var Bears = artifacts.require("Bears");
var Bulls = artifacts.require("Bulls");
var Bank = artifacts.require("Bank");
var GameWave = artifacts.require("./GameWave.sol");
var crowdSale = "0x0ba968f5fD6717A11B6f7Dfd0CBA41245c80C2bf";
module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Bank, crowdSale);
  deployer.deploy(GameWave);
};
