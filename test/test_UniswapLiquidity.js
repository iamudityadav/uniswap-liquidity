const {expect} = require("chai");
const {ethers, network} = require("hardhat");

const {abi} = require("../artifacts/contracts/interfaces/IERC20.sol/IERC20.json");

const provider = waffle.provider;

describe("UniswapLiquidity Contract", () => {
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const WETH_WHALE = "0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const DAI_WHALE = "0x60faae176336dab62e284fe19b885b095d29fb7f";

    let WETH_INSTANCE, DAI_INSTANCE;
    let UNISWAP_LIQUIDITY, WETH_AMOUNT, DAI_AMOUNT, caller;

    before(async () => {
        [caller] = await ethers.getSigners();

        WETH_INSTANCE = new ethers.Contract(WETH, abi, provider);
        DAI_INSTANCE = new ethers.Contract(DAI, abi, provider);
        
        const WETH_DECIMALS = await WETH_INSTANCE.decimals();
        const DAI_DECIMALS = await DAI_INSTANCE.decimals();

        let weth_amount = "1";
        let dai_amount = "1";

        WETH_AMOUNT = ethers.utils.parseUnits(weth_amount, WETH_DECIMALS);
        DAI_AMOUNT = ethers.utils.parseUnits(dai_amount, DAI_DECIMALS);

        //contract deployment
        const uniswapLiquidity = await ethers.getContractFactory("UniswapLiquidity");
        UNISWAP_LIQUIDITY = await uniswapLiquidity.deploy();
        await UNISWAP_LIQUIDITY.deployed();
    });
    
    it("should ensure caller has sufficient ETH", async () => {
        const caller_ETH = await provider.getBalance(caller.address);
        expect(caller_ETH).to.be.gte(ethers.utils.parseEther("1"));
    });

    it("should ensure whale has sufficient WETH", async () => {
        const whale_WETH_balance = await WETH_INSTANCE.balanceOf(WETH_WHALE);
        expect(whale_WETH_balance).to.be.gte(WETH_AMOUNT);
    });

    it("should ensure whale has sufficient DAI", async () => {
        const whale_DAI_balance = await DAI_INSTANCE.balanceOf(DAI_WHALE);
        expect(whale_DAI_balance).to.be.gte(DAI_AMOUNT);
    });
    
    it("should deploy UniswapLiquidity contract", async () => {
        expect(UNISWAP_LIQUIDITY.address).to.exist;
    });

    describe("Contract execution", () => {
        it("should add and remove liquidity", async () => {
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [WETH_WHALE],
            });
            const weth_whale_signer = await ethers.getSigner(WETH_WHALE);

            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [DAI_WHALE],
            });
            const dai_whale_signer = await ethers.getSigner(DAI_WHALE);
            
            await WETH_INSTANCE.connect(weth_whale_signer).transfer(caller.address, WETH_AMOUNT);
            await DAI_INSTANCE.connect(dai_whale_signer).transfer(caller.address, DAI_AMOUNT);

            await WETH_INSTANCE.connect(caller).approve(UNISWAP_LIQUIDITY.address, WETH_AMOUNT);
            await DAI_INSTANCE.connect(caller).approve(UNISWAP_LIQUIDITY.address, DAI_AMOUNT);

            let tx = await UNISWAP_LIQUIDITY.connect(caller).addLiquidity(WETH, DAI, WETH_AMOUNT, DAI_AMOUNT);
            let receipt = await tx.wait();

            console.log("==== Add liquidity ====");
            for (const event of receipt.events) {
                if(event.args){
                    console.log(`${event.args.message} : ${event.args.value}`);
                }
            }

            tx = await UNISWAP_LIQUIDITY.connect(caller).removeLiquidity(WETH, DAI);
            receipt = await tx.wait()

            console.log("\n==== Remove liquidity ====");
            for (const event of receipt.events) {
                if(event.args){
                    console.log(`${event.args.message} : ${event.args.value}`);
                    
                }
            }

            await network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [WETH_WHALE],
            });

            await network.provider.request({
                method: "hardhat_stopImpersonatingAccount",
                params: [DAI_WHALE],
            });
        });
    });
});