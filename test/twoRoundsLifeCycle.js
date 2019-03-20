import EVMRevert from './helpers/EVMRevert';
import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

let Bears = artifacts.require("Bears");
let Bulls = artifacts.require("Bulls");
let Bank = artifacts.require("Bank");
let GameWave = artifacts.require("GameWave");
let Sale = artifacts.require('Sale');

contract('Bank', async function(accounts) {

    before(async function () {
        await advanceBlock();
    });

    let owner = accounts[0];
    let user2 = accounts[2];
    let BearsContract;
    let BullsContract;
    let BankContract;
    let GameWaveContract;

    beforeEach(async function() {
        BankContract = await Bank.deployed();
        GameWaveContract = await GameWave.deployed();
    });

    it('is able to create token', async function () {
        let tokens = await GameWaveContract.balanceOf(owner);
        assert.equal(tokens.toString(), ether('20000000'));
    });

    it('is able set addresses each contracts', async function(){
        BearsContract = await Bears.new(BankContract.address, GameWaveContract.address);
        BullsContract = await Bulls.new(BankContract.address, GameWaveContract.address);
        await BankContract.setGameWaveAddress(GameWaveContract.address);
    });

    it('reset addresses should be reverted', async function(){
        await BankContract
            .setGameWaveAddress(GameWaveContract.address)
            .should.be.rejectedWith(EVMRevert);
        await BankContract
            .setBearsAddress(GameWaveContract.address)
            .should.be.rejectedWith(EVMRevert);
        await BankContract
            .setBullsAddress(GameWaveContract.address)
            .should.be.rejectedWith(EVMRevert);
    });

    it('is able to accept funds', async function () {
        let tempCurrentDeadline = await BankContract.currentDeadline();

        await BearsContract.sendTransaction({ value: ether("10"), from: owner });

        let balanceBearsETH = await BankContract.totalSupplyOfBears();
        assert.equal(balanceBearsETH.toString(), ether("8.1"), "this is bears balance");

        let currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 120);

        await BullsContract.sendTransaction({ value: ether("10"), from: accounts[1] });

        let balanceBullsETH = await BankContract.totalSupplyOfBulls();
        assert.equal(balanceBullsETH.toString(), ether("8.1"));

        currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 240);

        let countOfBears = await BankContract.countOfBears();
        assert.equal(countOfBears.toString(), 1);

        let countOfBulls = await BankContract.countOfBulls();
        assert.equal(countOfBulls.toString(), 1);

        let totalSupplyOfBulls = await BankContract.totalSupplyOfBulls();
        assert.equal(totalSupplyOfBulls.toString(), ether("8.1"));

        let totalSupplyOfBears = await BankContract.totalSupplyOfBears();
        assert.equal(totalSupplyOfBears.toString(), ether("8.1"));

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 5000);

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 5000);

        let lastHero = await BankContract.lastHero();
        assert.equal(lastHero.toString(), accounts[1]);

        let jackPot = await BankContract.jackPot();
        assert.equal(jackPot.toString(), ether("1.8"));

    });

    it('should to change probability', async function () {
        let tempCurrentDeadline = await BankContract.currentDeadline();

        await BearsContract.sendTransaction({ value: ether("10"), from: owner });

        let currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 120);

        let totalSupplyOfBears = await BankContract.totalSupplyOfBears();
        assert.equal(totalSupplyOfBears.toString(), ether("16.2"));

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 3334);

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 6666);

        let lastHero = await BankContract.lastHero();
        assert.equal(lastHero.toString(), owner);

        let jackPot = await BankContract.jackPot();
        assert.equal(jackPot.toString(), ether("2.7"));
    });

    it('should to change probability with GameWave', async function () {
        let tokens = await GameWaveContract.balanceOf(BearsContract.address);
        assert.equal(tokens.toString(), 0);

        await GameWaveContract.transfer(BullsContract.address, ether('20'));

        tokens = await GameWaveContract.balanceOf(BullsContract.address);
        assert.equal(tokens.toString(), ether('20'));

        await BankContract.calculateProbability();

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 5333);

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 4667);
    });

    it('should to get winner', async function () {
        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440*50],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });
        await advanceBlock();

        let state = await BankContract.getState();
        assert.equal(state, false);

        await BankContract.getWinners();

        let lastWinner = await BankContract.lastWinner();
        let lastTotalSupplyOfBears = await BankContract.lastTotalSupplyOfBears();
        let lastTotalSupplyOfBulls = await BankContract.lastTotalSupplyOfBulls();
        let currentRound = await BankContract.currentRound();

        console.log(lastWinner.toString() + " " + lastTotalSupplyOfBulls.toString() + " " + lastTotalSupplyOfBears.toString() + " round: " + currentRound);
    });

    it('is able second to accept funds', async function () {
        let tempCurrentDeadline = await BankContract.currentDeadline();

        let state = await BankContract.getState();
        assert.equal(state, true);

        await BearsContract.sendTransaction({ value: ether("10"), from: owner });

        let balanceBearsETH = await BankContract.totalSupplyOfBears();
        assert.equal(balanceBearsETH.toString(), ether("8.1"), "this is bears balance");

        let currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 120);

        await BullsContract.sendTransaction({ value: ether("10"), from: accounts[1] });

        let balanceBullsETH = await BankContract.totalSupplyOfBulls();
        assert.equal(balanceBullsETH.toString(), ether("8.1"), "this is bulls balance");

        await BankContract.sendTransaction({ value: 0, from: accounts[1] });
        await BankContract.sendTransaction({ value: 0, from: owner });

        let lastBalance = await BankContract.lastBalance();
        console.log(parseInt(lastBalance), "last balance");

        let withdrawn = await BankContract.withdrawn();
        console.log(parseInt(withdrawn), " withdrawn money");

        let withdrawnGW = await BankContract.withdrawnGW();
        console.log(parseInt(withdrawnGW), " withdrawnGW money");

        let balanceGW = await GameWaveContract.balanceOf(accounts[1]);
        console.log('Balance accounts1 in tokens' + balanceGW);

        let balance = await web3.eth.getBalance(BankContract.address);
        console.log('Balance after withdraw : ' + balance);

        currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 240);

        let lastCountOfBears = await BankContract.lastCountOfBears();
        assert.equal(lastCountOfBears.toString(), 1, "this is last count of Bears");

        let lastCountOfBulls = await BankContract.lastCountOfBulls();
        assert.equal(lastCountOfBulls.toString(), 1, "this is last count of Bulls");

        let countOfBears = await BankContract.countOfBears();
        assert.equal(countOfBears.toString(), 1, "this is Bears");

        let countOfBulls = await BankContract.countOfBulls();
        assert.equal(countOfBulls.toString(), 1, "this is Bulls");

        let totalSupplyOfBulls = await BankContract.totalSupplyOfBulls();
        assert.equal(totalSupplyOfBulls.toString(), ether("8.1"), "this is totalSupplyOfBulls");

        let totalSupplyOfBears = await BankContract.totalSupplyOfBears();
        assert.equal(totalSupplyOfBears.toString(), ether("8.1"), "this is totalSupplyOfBears");

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 5000, "this is probabilityOfBulls");

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 5000, "this is probabilityOfBears");

        let lastHero = await BankContract.lastHero();
        assert.equal(lastHero.toString(), accounts[1], "this is lastHero");

        let lastJackPot = await BankContract.lastJackPot();
        assert.equal(lastJackPot.toString(), ether("2.7"), "this is last round jackPot");

        let jackPot = await BankContract.jackPot();
        assert.equal(jackPot.toString(), ether("1.8"), "this is jackPot");

    });

    it('should to get winner after 2 round', async function () {
        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440*50],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });
        await advanceBlock();

        let state = await BankContract.getState();
        assert.equal(state, false);

        await BankContract.getWinners();

        let lastWinner = await BankContract.lastWinner();
        let lastTotalSupplyOfBears = await BankContract.lastTotalSupplyOfBears();
        let lastTotalSupplyOfBulls = await BankContract.lastTotalSupplyOfBulls();
        let currentRound = await BankContract.currentRound();

        console.log(lastWinner.toString() + " " + lastTotalSupplyOfBulls.toString() + " " + lastTotalSupplyOfBears.toString() + " round: " + currentRound);
    });

    it('is able third to accept funds', async function () {
        let tempCurrentDeadline = await BankContract.currentDeadline();

        let state = await BankContract.getState();
        assert.equal(state, true);

        let balanceBank = await web3.eth.getBalance(BankContract.address);
        console.log(balanceBank.toString());

        await BearsContract.sendTransaction({ value: ether("10"), from: owner });

        let balanceBearsETH = await BankContract.totalSupplyOfBears();
        assert.equal(balanceBearsETH.toString(), ether("8.1"), "this is bears balance");

        let currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 120);

        await BullsContract.sendTransaction({ value: ether("10"), from: accounts[2] });

        let balanceBullsETH = await BankContract.totalSupplyOfBears();
        assert.equal(balanceBullsETH.toString(), ether("8.1"), "this is bears balance");

        let oldBalance = await web3.eth.getBalance(BankContract.address);

        await BankContract.sendTransaction({ value: 0, from: owner });

        let balance = await web3.eth.getBalance(BankContract.address);
        console.log('Balance after withdraw : ' + balance);

        let ownerBalance = oldBalance - balance;
        assert.equal(balance, oldBalance - ownerBalance);

        currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 240);

        let lastCountOfBears = await BankContract.lastCountOfBears();
        assert.equal(lastCountOfBears.toString(), 1, "this is last count of Bears");

        let lastCountOfBulls = await BankContract.lastCountOfBulls();
        assert.equal(lastCountOfBulls.toString(), 1, "this is last count of Bulls");

        let countOfBears = await BankContract.countOfBears();
        assert.equal(countOfBears.toString(), 1, "this is Bears");

        let countOfBulls = await BankContract.countOfBulls();
        assert.equal(countOfBulls.toString(), 1, "this is Bulls");

        let totalSupplyOfBulls = await BankContract.totalSupplyOfBulls();
        assert.equal(totalSupplyOfBulls.toString(), ether("8.1"), "this is totalSupplyOfBulls");

        let totalSupplyOfBears = await BankContract.totalSupplyOfBears();
        assert.equal(totalSupplyOfBears.toString(), ether("8.1"), "this is totalSupplyOfBears");

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 5000, "this is probabilityOfBulls");

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 5000, "this is probabilityOfBears");

        let lastHero = await BankContract.lastHero();
        assert.equal(lastHero.toString(), accounts[2], "this is lastHero");

        let lastJackPot = await BankContract.lastJackPot();
        assert.equal(lastJackPot.toString(), ether("1.8"), "this is last round jackPot");

        let jackPot = await BankContract.jackPot();
        assert.equal(jackPot.toString(), ether("1.8"), "this is jackPot");
    });

    it('should to get winner after 3 round', async function () {
        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440*50],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });
        await advanceBlock();

        let state = await BankContract.getState();
        assert.equal(state, false);

        await BankContract.getWinners();

        let lastWinner = await BankContract.lastWinner();
        let lastTotalSupplyOfBears = await BankContract.lastTotalSupplyOfBears();
        let lastTotalSupplyOfBulls = await BankContract.lastTotalSupplyOfBulls();
        let currentRound = await BankContract.currentRound();

        console.log(lastWinner.toString() + " " + lastTotalSupplyOfBulls.toString() + " " + lastTotalSupplyOfBears.toString() + " round: " + currentRound);
    });

    it('is able third to accept funds', async function () {
        let tempCurrentDeadline = await BankContract.currentDeadline();

        let state = await BankContract.getState();
        assert.equal(state, true);

        let balanceBank = await web3.eth.getBalance(BankContract.address);
        console.log(balanceBank.toString());

        await BearsContract.sendTransaction({ value: ether("10"), from: owner });

        let balanceBearsETH = await BankContract.totalSupplyOfBears();
        assert.equal(balanceBearsETH.toString(), ether("8.1"), "this is bears balance");

        let currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 120);

        await BullsContract.sendTransaction({ value: ether("10"), from: accounts[2] });

        let balanceBullsETH = await BankContract.totalSupplyOfBears();
        assert.equal(balanceBullsETH.toString(), ether("8.1"), "this is bears balance");

        let oldBalance = await web3.eth.getBalance(BankContract.address);

        await BankContract.sendTransaction({ value: 0, from: owner });

        let balance = await web3.eth.getBalance(BankContract.address);
        console.log('Balance after withdraw : ' + balance);

        let ownerBalance = oldBalance - balance;
        assert.equal(balance, oldBalance - ownerBalance);

        currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 240);

        let lastCountOfBears = await BankContract.lastCountOfBears();
        assert.equal(lastCountOfBears.toString(), 1, "this is last count of Bears");

        let lastCountOfBulls = await BankContract.lastCountOfBulls();
        assert.equal(lastCountOfBulls.toString(), 1, "this is last count of Bulls");

        let countOfBears = await BankContract.countOfBears();
        assert.equal(countOfBears.toString(), 1, "this is Bears");

        let countOfBulls = await BankContract.countOfBulls();
        assert.equal(countOfBulls.toString(), 1, "this is Bulls");

        let totalSupplyOfBulls = await BankContract.totalSupplyOfBulls();
        assert.equal(totalSupplyOfBulls.toString(), ether("8.1"), "this is totalSupplyOfBulls");

        let totalSupplyOfBears = await BankContract.totalSupplyOfBears();
        assert.equal(totalSupplyOfBears.toString(), ether("8.1"), "this is totalSupplyOfBears");

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 5000, "this is probabilityOfBulls");

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 5000, "this is probabilityOfBears");

        let lastHero = await BankContract.lastHero();
        assert.equal(lastHero.toString(), accounts[2], "this is lastHero");

        let lastJackPot = await BankContract.lastJackPot();
        assert.equal(lastJackPot.toString(), ether("1.8"), "this is last round jackPot");

        let jackPot = await BankContract.jackPot();
        assert.equal(jackPot.toString(), ether("1.8"), "this is jackPot");
    });
});

