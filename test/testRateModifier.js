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

    it('is able to set rate token', async  function () {
        await BankContract.setRateToken(10, 0);
    });

    it('is able to accept funds', async function () {
        let tempCurrentDeadline = await BankContract.currentDeadline();

        await BearsContract.sendTransaction({ value: ether("10"), from: owner });
        assert.equal(await web3.eth.getBalance(BankContract.address), ether("9"));

        let currentDeadline = await BankContract.currentDeadline();
        assert.equal(currentDeadline.toString(), parseInt(tempCurrentDeadline) + 120);

        await BullsContract.sendTransaction({ value: ether("10"), from: accounts[1] });
        assert.equal(await web3.eth.getBalance(BankContract.address), ether("18"));

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
        assert.equal(await web3.eth.getBalance(BankContract.address), ether("27"));

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

        await GameWaveContract.transfer(BullsContract.address, ether('2'));

        tokens = await GameWaveContract.balanceOf(BullsContract.address);
        assert.equal(tokens.toString(), ether('2'));

        await BankContract.calculateProbability();

        let probabilityOfBulls = await BankContract.probabilityOfBulls();
        assert.equal(probabilityOfBulls.toString(), 5333, "probability of Bulls");

        let probabilityOfBears = await BankContract.probabilityOfBears();
        assert.equal(probabilityOfBears.toString(), 4667, "probability of Bears");
    });
});

