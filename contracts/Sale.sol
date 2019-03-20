pragma solidity 0.5.0;

import "./GameWave.sol";

contract Sale {

    GameWave public GWContract;
    uint256 public buyPrice;
    address public owner;
    uint balance;

    bool crowdSaleClosed = false;

    constructor(
        address payable _GWContract
    ) payable public {
        owner = msg.sender;
        GWContract = GameWave(_GWContract);
        GWContract.approve(owner, 9999999999999999999000000000000000000);
    }

    /**
     * @notice Allow users to buy tokens for `newBuyPrice`
     * @param newBuyPrice Price users can buy from the contract.
     */

    function setPrice(uint256 newBuyPrice) public {
        buyPrice = newBuyPrice;
    }

    /**
     * Fallback function
     *
     * The function without name is the default function that is called whenever anyone sends funds to a contract and
     * sends tokens to the buyer.
     */

    function () payable external {
        uint amount = msg.value;
        balance = (amount / buyPrice) * 10 ** 18;
        GWContract.transfer(msg.sender, balance);
        address(GWContract).transfer(amount);
    }
}