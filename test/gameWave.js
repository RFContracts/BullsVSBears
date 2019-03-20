import EVMRevert from './helpers/EVMRevert';
import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const GameWave = artifacts.require('GameWave');

contract('GameWave', (accounts) => {

    let user = accounts[1];
    let user1 = accounts[2];
    let owner = accounts[0];
    let gameWaveContract;
    let unix = Math.round(+new Date()/1000);

    before(async function () {
        gameWaveContract = await GameWave.deployed();
        await advanceBlock();
    });

    it('able send transaction on contract', async () => {
        await gameWaveContract.sendTransaction({from:owner, value:ether('10')});

        let contractAddress = await gameWaveContract.address;
        let balance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(balance.toString(), ether('10'));
    });

    it('able transfer tokens to the user', async () => {
        await gameWaveContract.transfer(user, ether('100000'));
        await gameWaveContract.transfer(user1, ether('100000'));

        let balanceUser = await gameWaveContract.balanceOf(user);
        assert.equal(balanceUser.toString(), ether('100000'));

        let balanceUser1 = await gameWaveContract.balanceOf(user1);
        assert.equal(balanceUser1.toString(), ether('100000'));
    });

    it('able get and withdraw dividends before end round should be equal 0', async () => {
        let contractAddress = await gameWaveContract.address;

        let tempBalance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(tempBalance.toString(), ether('10'));

        let dividends = await gameWaveContract.getDividends(user);
        assert.equal(dividends.toString(), ether('0'));

        await gameWaveContract.withdrawDividends(user);

        let balance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(tempBalance.toString(), balance.toString());
    });

    it('able get and withdraw dividends after end round', async () => {

        // await testUtil.evmIncreaseTime(60*1440*30);
        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440*30],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });

        await advanceBlock();

        await gameWaveContract.startPayments();

        let dividends = (await gameWaveContract.getDividends(user)).toString();
        assert.equal(dividends, ether('0.05'), "get user dividends after 1st round");

        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });

        await gameWaveContract.withdrawDividends(user);
    });

    it('able send transaction on contract', async () => {
        await gameWaveContract.sendTransaction({from:owner, value:ether('20')});

        let contractAddress = await gameWaveContract.address;
        let balance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(balance.toString(), ether('29.95'));
    });

    it('able get and withdraw dividends second round equal 0', async () => {
        let contractAddress = await gameWaveContract.address;

        let tempBalance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(tempBalance.toString(), ether('29.95'));

        let dividends = await gameWaveContract.getDividends(user);
        assert.equal(dividends.toString(), ether('0'));

        await gameWaveContract.withdrawDividends(user);

        let balance = (await web3.eth.getBalance(contractAddress)).toString();
        assert.equal(tempBalance.toString(), balance.toString());
    });

    it('able get and withdraw dividends after second end round', async () => {

        // await testUtil.evmIncreaseTime(60*1440*30);
        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440*31],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });

        await advanceBlock();

        await gameWaveContract.startPayments();

        let dividends = (await gameWaveContract.getDividends(user)).toString();
        assert.equal(dividends, ether('0.1'), "get user dividends after 2nd round");

        new Promise(function (resolve, reject) {
            return web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [60*1440*30],
                id: new Date().getTime()
            }, function (error, result) {
                return error ? reject(error) : resolve(result.result);
            });
        });
        //
        dividends = (await gameWaveContract.getDividends(user)).toString();
        assert.equal(dividends, ether('0.1'), "get user dividends after 2nd round");

        await gameWaveContract.withdrawDividends(user);
    });

    //  it('able reverted start payments', async () => {
    //     await gameWaveContract.startPayments().should.be.rejectedWith(EVMRevert);
    // });

});