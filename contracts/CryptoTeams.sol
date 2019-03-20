pragma solidity 0.5.0;

import './GameWave.sol';
import './Bank.sol';

/**
* @dev Base contract for teams
*/
contract CryptoTeam {
    using SafeMath for uint256;

    //Developers fund
    address payable public owner;

    Bank public BankContract;
    GameWave public GameWaveContract;

    constructor() public {
        owner = msg.sender;
    }

    /**
    * @dev Payable function. 10% will send to Developers fund and 90% will send to Bank contract.
    * Also setting info about player.
    */
    function () external payable {
        require(BankContract.getState() && msg.value >= 0.05 ether);

        BankContract.setInfo(msg.sender, msg.value.mul(90).div(100));

        owner.transfer(msg.value.mul(10).div(100));

        address(BankContract).transfer(msg.value.mul(90).div(100));
    }
}

/*
* @dev Bears contract. To play game with Bears send ETH to this contract
*/
contract Bears is CryptoTeam {
    constructor(address payable _bankAddress, address payable _GameWaveAddress) public {
        BankContract = Bank(_bankAddress);
        BankContract.setBearsAddress(address(this));
        GameWaveContract = GameWave(_GameWaveAddress);
        GameWaveContract.approve(_bankAddress, 9999999999999999999000000000000000000);
    }
}

/*
* @dev Bulls contract. To play game with Bulls send ETH to this contract
*/
contract Bulls is CryptoTeam {
    constructor(address payable _bankAddress, address payable _GameWaveAddress) public {
        BankContract = Bank(_bankAddress);
        BankContract.setBullsAddress(address(this));
        GameWaveContract = GameWave(_GameWaveAddress);
        GameWaveContract.approve(_bankAddress, 9999999999999999999000000000000000000);
    }
}

