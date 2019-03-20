import EVMRevert from './helpers/EVMRevert';
import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
const testUtil = require('solidity-test-util');
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

let Sale = artifacts.require('Sale');
let GameWave = artifacts.require("GameWave");

contract("Sale", (accounts) => {

    let saleContract;
    let gameWaveContract;
    let user = accounts[1];
    let user1 = accounts[2];
    let user2 = accounts[3];
    let user3 = accounts[4];

    before(async function () {
        await advanceBlock();
        gameWaveContract = await GameWave.deployed();
    });

    it('able set price', async () => {
        let contractAddress = await gameWaveContract.address;

        saleContract = await Sale.new(contractAddress);

        await saleContract.setPrice(ether('0.01'));
    });

    it('able send tokens on contract', async () => {
        let contractAddress = await saleContract.address;

        await gameWaveContract.transfer(contractAddress, ether('10000'));
    });

    it('should be send transaction on contract balance', async () => {
        let contractAddress = await saleContract.address;
        let contractAddressToken = await gameWaveContract.address;

        let tempBalance = await gameWaveContract.balanceOf(contractAddress);
        assert.equal(tempBalance.toString(), ether('10000'));

        await saleContract.sendTransaction({from: user, value: ether('25')});

        let balance = await gameWaveContract.balanceOf(contractAddress);
        assert.equal(ether('7500').toString(), balance.toString());

        let contractBalance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(contractBalance, ether('0'));

        await saleContract.sendTransaction({from: user1, value: ether('25')});
        await saleContract.sendTransaction({from: user2, value: ether('25')});
        await saleContract.sendTransaction({from: user3, value: ether('25')});

        contractBalance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(contractBalance, ether('0'));

        balance = await gameWaveContract.balanceOf(contractAddress);
        assert.equal(balance.toString(), ether('0'));

        let contractTokenBalance = (await web3.eth.getBalance(contractAddressToken)).toString();
        assert.equal(contractTokenBalance, ether('100'));
    });
});