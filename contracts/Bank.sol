pragma solidity 0.5.0;

import './GameWave.sol';
import './CryptoTeams.sol';

/*
* @title Bank
* @dev Bank contract which contained all ETH from Bulls and Bears teams.
* When time in blockchain will be grater then current deadline or last deadline need call getWinner function
* then participants able get prizes.
*
* Last participant(last hero) win 10% from all bank
*
* - To get prize send 0 ETH to this contract
*/
contract Bank is Ownable {

    using SafeMath for uint256;

    mapping (uint256 => mapping (address => uint256)) public depositBears;
    mapping (uint256 => mapping (address => uint256)) public depositBulls;

    uint256 public currentDeadline;
    uint256 public currentRound = 1;
    uint256 public lastDeadline;
    uint256 public defaultCurrentDeadlineInHours = 24;
    uint256 public defaultLastDeadlineInHours = 48;
    uint256 public countOfBears;
    uint256 public countOfBulls;
    uint256 public totalSupplyOfBulls;
    uint256 public totalSupplyOfBears;
    uint256 public totalGWSupplyOfBulls;
    uint256 public totalGWSupplyOfBears;
    uint256 public probabilityOfBulls;
    uint256 public probabilityOfBears;
    address public lastHero;
    address public lastHeroHistory;
    uint256 public jackPot;
    uint256 public winner;
    uint256 public withdrawn;
    uint256 public withdrawnGW;
    uint256 public remainder;
    uint256 public remainderGW;
    uint256 public rate = 1;
    uint256 public rateModifier = 0;
    uint256 public tokenReturn;
    address crowdSale;

    uint256 public lastTotalSupplyOfBulls;
    uint256 public lastTotalSupplyOfBears;
    uint256 public lastTotalGWSupplyOfBulls;
    uint256 public lastTotalGWSupplyOfBears;
    uint256 public lastProbabilityOfBulls;
    uint256 public lastProbabilityOfBears;
    address public lastRoundHero;
    uint256 public lastJackPot;
    uint256 public lastWinner;
    uint256 public lastBalance;
    uint256 public lastBalanceGW;
    uint256 public lastCountOfBears;
    uint256 public lastCountOfBulls;
    uint256 public lastWithdrawn;
    uint256 public lastWithdrawnGW;


    bool public finished = false;

    Bears public BearsContract;
    Bulls public BullsContract;
    GameWave public GameWaveContract;

    /*
    * @dev Constructor create first deadline
    */
    constructor(address _crowdSale) public {
        _setRoundTime(6, 8);
        crowdSale = _crowdSale;
    }

    /**
    * @dev Setter token rate.
    * @param _rate this value for change percent relation rate to count of tokens.
    * @param _rateModifier this value for change math operation under tokens.
    */
    function setRateToken(uint256 _rate, uint256 _rateModifier) public onlyOwner returns(uint256){
        rate = _rate;
        rateModifier = _rateModifier;
    }

    /**
    * @dev Setter crowd sale address.
    * @param _crowdSale Address of the crowd sale contract.
    */
    function setCrowdSale(address _crowdSale) public onlyOwner{
        crowdSale = _crowdSale;
    }

    /**
    * @dev Setter round time.
    * @param _currentDeadlineInHours this value current deadline in hours.
    * @param _lastDeadlineInHours this value last deadline in hours.
    */
    function _setRoundTime(uint _currentDeadlineInHours, uint _lastDeadlineInHours) internal {
        defaultCurrentDeadlineInHours = _currentDeadlineInHours;
        defaultLastDeadlineInHours = _lastDeadlineInHours;
        currentDeadline = block.timestamp + 60 * 60 * _currentDeadlineInHours;
        lastDeadline = block.timestamp + 60 * 60 * _lastDeadlineInHours;
    }

    /**
    * @dev Setter round time.
    * @param _currentDeadlineInHours this value current deadline in hours.
    * @param _lastDeadlineInHours this value last deadline in hours.
    */
    function setRoundTime(uint _currentDeadlineInHours, uint _lastDeadlineInHours) public onlyOwner {
        _setRoundTime(_currentDeadlineInHours, _lastDeadlineInHours);
    }


    /**
    * @dev Setter the GameWave contract address. Address can be set at once.
    * @param _GameWaveAddress Address of the GameWave contract
    */
    function setGameWaveAddress(address payable _GameWaveAddress) public {
        require(address(GameWaveContract) == address(0x0));
        GameWaveContract = GameWave(_GameWaveAddress);
    }

    /**
    * @dev Setter the Bears contract address. Address can be set at once.
    * @param _bearsAddress Address of the Bears contract
    */
    function setBearsAddress(address payable _bearsAddress) external {
        require(address(BearsContract) == address(0x0));
        BearsContract = Bears(_bearsAddress);
    }

    /**
    * @dev Setter the Bulls contract address. Address can be set at once.
    * @param _bullsAddress Address of the Bulls contract
    */
    function setBullsAddress(address payable _bullsAddress) external {
        require(address(BullsContract) == address(0x0));
        BullsContract = Bulls(_bullsAddress);
    }

    /**
    * @dev Getting time from blockchain for timer
    */
    function getNow() view public returns(uint){
        return block.timestamp;
    }

    /**
    * @dev Getting state of game. True - game continue, False - game stopped
    */
    function getState() view public returns(bool) {
        if (block.timestamp > currentDeadline) {
            return false;
        }
        return true;
    }

    /**
    * @dev Setting info about participant from Bears or Bulls contract
    * @param _lastHero Address of participant
    * @param _deposit Amount of deposit
    */
    function setInfo(address _lastHero, uint256 _deposit) public {
        require(address(BearsContract) == msg.sender || address(BullsContract) == msg.sender);

        if (address(BearsContract) == msg.sender) {
            require(depositBulls[currentRound][_lastHero] == 0, "You are already in bulls team");
            if (depositBears[currentRound][_lastHero] == 0)
                countOfBears++;
            totalSupplyOfBears = totalSupplyOfBears.add(_deposit.mul(90).div(100));
            depositBears[currentRound][_lastHero] = depositBears[currentRound][_lastHero].add(_deposit.mul(90).div(100));
        }

        if (address(BullsContract) == msg.sender) {
            require(depositBears[currentRound][_lastHero] == 0, "You are already in bears team");
            if (depositBulls[currentRound][_lastHero] == 0)
                countOfBulls++;
            totalSupplyOfBulls = totalSupplyOfBulls.add(_deposit.mul(90).div(100));
            depositBulls[currentRound][_lastHero] = depositBulls[currentRound][_lastHero].add(_deposit.mul(90).div(100));
        }

        lastHero = _lastHero;

        if (currentDeadline.add(120) <= lastDeadline) {
            currentDeadline = currentDeadline.add(120);
        } else {
            currentDeadline = lastDeadline;
        }

        jackPot += _deposit.mul(10).div(100);

        calculateProbability();
    }

    function estimateTokenPercent(uint256 _difference) public view returns(uint256){
        if (rateModifier == 0) {
            return _difference.mul(rate);
        } else {
            return _difference.div(rate);
        }
    }

    /**
    * @dev Calculation probability for team's win
    */
    function calculateProbability() public {
        require(winner == 0 && getState());

        totalGWSupplyOfBulls = GameWaveContract.balanceOf(address(BullsContract));
        totalGWSupplyOfBears = GameWaveContract.balanceOf(address(BearsContract));
        uint256 percent = (totalSupplyOfBulls.add(totalSupplyOfBears)).div(100);

        if (totalGWSupplyOfBulls < 1 ether) {
            totalGWSupplyOfBulls = 0;
        }

        if (totalGWSupplyOfBears < 1 ether) {
            totalGWSupplyOfBears = 0;
        }

        if (totalGWSupplyOfBulls <= totalGWSupplyOfBears) {
            uint256 difference = totalGWSupplyOfBears.sub(totalGWSupplyOfBulls).div(0.01 ether);

            probabilityOfBears = totalSupplyOfBears.mul(100).div(percent).add(estimateTokenPercent(difference));

            if (probabilityOfBears > 8000) {
                probabilityOfBears = 8000;
            }
            if (probabilityOfBears < 2000) {
                probabilityOfBears = 2000;
            }
            probabilityOfBulls = 10000 - probabilityOfBears;
        } else {
            uint256 difference = totalGWSupplyOfBulls.sub(totalGWSupplyOfBears).div(0.01 ether);
            probabilityOfBulls = totalSupplyOfBulls.mul(100).div(percent).add(estimateTokenPercent(difference));

            if (probabilityOfBulls > 8000) {
                probabilityOfBulls = 8000;
            }
            if (probabilityOfBulls < 2000) {
                probabilityOfBulls = 2000;
            }
            probabilityOfBears = 10000 - probabilityOfBulls;
        }

        totalGWSupplyOfBulls = GameWaveContract.balanceOf(address(BullsContract));
        totalGWSupplyOfBears = GameWaveContract.balanceOf(address(BearsContract));
    }

    /**
    * @dev Getting winner team
    */
    function getWinners() public {
        require(winner == 0 && !getState());
        uint256 seed1 = address(this).balance;
        uint256 seed2 = totalSupplyOfBulls;
        uint256 seed3 = totalSupplyOfBears;
        uint256 seed4 = totalGWSupplyOfBulls;
        uint256 seed5 = totalGWSupplyOfBulls;
        uint256 seed6 = block.difficulty;
        uint256 seed7 = block.timestamp;

        bytes32 randomHash = keccak256(abi.encodePacked(seed1, seed2, seed3, seed4, seed5, seed6, seed7));
        uint randomNumber = uint(randomHash);

        if (randomNumber == 0){
            randomNumber = 1;
        }

        uint winningNumber = randomNumber % 10000;

        if (1 <= winningNumber && winningNumber <= probabilityOfBears){
            winner = 1;
        }

        if (probabilityOfBears < winningNumber && winningNumber <= 10000){
            winner = 2;
        }

        if (GameWaveContract.balanceOf(address(BullsContract)) > 0)
            GameWaveContract.transferFrom(
                address(BullsContract),
                address(this),
                GameWaveContract.balanceOf(address(BullsContract))
            );

        if (GameWaveContract.balanceOf(address(BearsContract)) > 0)
            GameWaveContract.transferFrom(
                address(BearsContract),
                address(this),
                GameWaveContract.balanceOf(address(BearsContract))
            );

        lastTotalSupplyOfBulls = totalSupplyOfBulls;
        lastTotalSupplyOfBears = totalSupplyOfBears;
        lastTotalGWSupplyOfBears = totalGWSupplyOfBears;
        lastTotalGWSupplyOfBulls = totalGWSupplyOfBulls;
        lastRoundHero = lastHero;
        lastJackPot = jackPot;
        lastWinner = winner;
        lastCountOfBears = countOfBears;
        lastCountOfBulls = countOfBulls;
        lastWithdrawn = withdrawn;
        lastWithdrawnGW = withdrawnGW;

        if (lastBalance > lastWithdrawn){
            remainder = lastBalance.sub(lastWithdrawn);
            address(GameWaveContract).transfer(remainder);
        }

        lastBalance = lastTotalSupplyOfBears.add(lastTotalSupplyOfBulls).add(lastJackPot);

        if (lastBalanceGW > lastWithdrawnGW){
            remainderGW = lastBalanceGW.sub(lastWithdrawnGW);
            tokenReturn = (totalGWSupplyOfBears.add(totalGWSupplyOfBulls)).mul(20).div(100).add(remainderGW);
            GameWaveContract.transfer(crowdSale, tokenReturn);
        }

        lastBalanceGW = GameWaveContract.balanceOf(address(this));

        totalSupplyOfBulls = 0;
        totalSupplyOfBears = 0;
        totalGWSupplyOfBulls = 0;
        totalGWSupplyOfBears = 0;
        remainder = 0;
        remainderGW = 0;
        jackPot = 0;

        withdrawn = 0;
        winner = 0;
        withdrawnGW = 0;
        countOfBears = 0;
        countOfBulls = 0;
        probabilityOfBulls = 0;
        probabilityOfBears = 0;

        _setRoundTime(defaultCurrentDeadlineInHours, defaultLastDeadlineInHours);
        currentRound++;
    }

    /**
    * @dev Payable function for take prize
    */
    function () external payable {
        if (msg.value == 0){
            require(depositBears[currentRound - 1][msg.sender] > 0 || depositBulls[currentRound - 1][msg.sender] > 0);

            uint payout = 0;
            uint payoutGW = 0;

            if (lastWinner == 1 && depositBears[currentRound - 1][msg.sender] > 0) {
                payout = calculateLastETHPrize(msg.sender);
            }
            if (lastWinner == 2 && depositBulls[currentRound - 1][msg.sender] > 0) {
                payout = calculateLastETHPrize(msg.sender);
            }

            if (payout > 0) {
                depositBears[currentRound - 1][msg.sender] = 0;
                depositBulls[currentRound - 1][msg.sender] = 0;
                withdrawn = withdrawn.add(payout);
                msg.sender.transfer(payout);
            }

            if ((lastWinner == 1 && depositBears[currentRound - 1][msg.sender] == 0) || (lastWinner == 2 && depositBulls[currentRound - 1][msg.sender] == 0)) {
                payoutGW = calculateLastGWPrize(msg.sender);
                withdrawnGW = withdrawnGW.add(payoutGW);
                GameWaveContract.transfer(msg.sender, payoutGW);
            }

            if (msg.sender == lastRoundHero) {
                lastHeroHistory = lastRoundHero;
                lastRoundHero = address(0x0);
                withdrawn = withdrawn.add(lastJackPot);
                msg.sender.transfer(lastJackPot);
            }
        }
    }

    /**
    * @dev Getting ETH prize of participant
    * @param participant Address of participant
    */
    function calculateETHPrize(address participant) public view returns(uint) {

        uint payout = 0;
        uint256 totalSupply = (totalSupplyOfBears.add(totalSupplyOfBulls));

        if (depositBears[currentRound][participant] > 0) {
            payout = totalSupply.mul(depositBears[currentRound][participant]).div(totalSupplyOfBears);
        }

        if (depositBulls[currentRound][participant] > 0) {
            payout = totalSupply.mul(depositBulls[currentRound][participant]).div(totalSupplyOfBulls);
        }

        return payout;
    }

    /**
    * @dev Getting GW Token prize of participant
    * @param participant Address of participant
    */
    function calculateGWPrize(address participant) public view returns(uint) {

        uint payout = 0;
        uint totalSupply = (totalGWSupplyOfBears.add(totalGWSupplyOfBulls)).mul(80).div(100);

        if (depositBears[currentRound][participant] > 0) {
            payout = totalSupply.mul(depositBears[currentRound][participant]).div(totalSupplyOfBears);
        }

        if (depositBulls[currentRound][participant] > 0) {
            payout = totalSupply.mul(depositBulls[currentRound][participant]).div(totalSupplyOfBulls);
        }

        return payout;
    }

    /**
    * @dev Getting ETH prize of _lastParticipant
    * @param _lastParticipant Address of _lastParticipant
    */
    function calculateLastETHPrize(address _lastParticipant) public view returns(uint) {

        uint payout = 0;
        uint256 totalSupply = (lastTotalSupplyOfBears.add(lastTotalSupplyOfBulls));

        if (depositBears[currentRound - 1][_lastParticipant] > 0) {
            payout = totalSupply.mul(depositBears[currentRound - 1][_lastParticipant]).div(lastTotalSupplyOfBears);
        }

        if (depositBulls[currentRound - 1][_lastParticipant] > 0) {
            payout = totalSupply.mul(depositBulls[currentRound - 1][_lastParticipant]).div(lastTotalSupplyOfBulls);
        }

        return payout;
    }

    /**
    * @dev Getting GW Token prize of _lastParticipant
    * @param _lastParticipant Address of _lastParticipant
    */
    function calculateLastGWPrize(address _lastParticipant) public view returns(uint) {

        uint payout = 0;
        uint totalSupply = (lastTotalGWSupplyOfBears.add(lastTotalGWSupplyOfBulls)).mul(80).div(100);

        if (depositBears[currentRound - 1][_lastParticipant] > 0) {
            payout = totalSupply.mul(depositBears[currentRound - 1][_lastParticipant]).div(lastTotalSupplyOfBears);
        }

        if (depositBulls[currentRound - 1][_lastParticipant] > 0) {
            payout = totalSupply.mul(depositBulls[currentRound - 1][_lastParticipant]).div(lastTotalSupplyOfBulls);
        }

        return payout;
    }
}
