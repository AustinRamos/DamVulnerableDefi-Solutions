const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Side entrance', function () {

    let deployer, attacker;

    const ETHER_IN_POOL = ethers.utils.parseEther('1000');

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, attacker] = await ethers.getSigners();

        const SideEntranceLenderPoolFactory = await ethers.getContractFactory('SideEntranceLenderPool', deployer);
        this.pool = await SideEntranceLenderPoolFactory.deploy();

        
        const Attacker = await ethers.getContractFactory('Attacker', attacker);
        this.attackercontract = await Attacker.deploy(this.pool.address, attacker.address)

        
        await this.pool.deposit({ value: ETHER_IN_POOL });

        this.attackerInitialEthBalance = await ethers.provider.getBalance(attacker.address);

        expect(
            await ethers.provider.getBalance(this.pool.address)
        ).to.equal(ETHER_IN_POOL);
    });


    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE */
        await this.attackercontract.attack();
        const res = await this.pool.getBalance(this.attackercontract.address)
        console.log("RES : " , res.toNumber())
        // const res =  await ethers.provider.getBalance(this.atta.address)
        // console.log("")
        //await this.attackercontract.connect(attacker).withdraw();
       //await this.pool.withdraw();
       //await this.pool.connect(attacker).deposit(ethers.utils.parseEther('10'))
    //    await this.pool.connect(attacker).deposit({value:ethers.utils.parseEther('10') })
        //const poolbalance = await ethers.provider.getBalance(this.pool.address)
        //console.log("pool balance after attack/withdraw : ", ethers.utils.formatEther(poolbalance.toNumber()))
    //   await this.pool.connect(attacker).withdraw()
    //   const res2 = await ethers.provider.getBalance(attacker.address)
    //   expect(res1).to.not.be.equal(res2)
    });

    after(async function () {
        /** SUCCESS CONDITIONS */
        expect(
            await ethers.provider.getBalance(this.pool.address)
        ).to.be.equal('0');
        
        // Not checking exactly how much is the final balance of the attacker,
        // because it'll depend on how much gas the attacker spends in the attack
        // If there were no gas costs, it would be balance before attack + ETHER_IN_POOL
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.be.gt(this.attackerInitialEthBalance);
    });
});
