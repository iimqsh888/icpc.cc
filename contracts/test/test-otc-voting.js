import hre from "hardhat";

async function main() {
    console.log("Testing OTC + Voting Contracts\n");

    const [deployer, user1, user2, user3, user4] = await hre.ethers.getSigners();
    
    console.log("Test Accounts:");
    console.log("  Deployer:", deployer.address);
    console.log("  Users:", user1.address, "...\n");

    // Deploy Mock CPC Token
    console.log("Deploying Mock CPC Token...");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const cpcToken = await MockERC20.deploy("CPC Token", "CPC", hre.ethers.parseEther("1000000"));
    await cpcToken.waitForDeployment();
    const cpcAddress = await cpcToken.getAddress();
    console.log("CPC Token:", cpcAddress);

    // Mint tokens
    await cpcToken.mint(user1.address, hre.ethers.parseEther("1000"));
    await cpcToken.mint(user2.address, hre.ethers.parseEther("1000"));
    await cpcToken.mint(user3.address, hre.ethers.parseEther("10"));
    await cpcToken.mint(user4.address, hre.ethers.parseEther("10"));

    // Deploy Voting Contract
    console.log("Deploying Voting Contract...");
    const CPCVoting = await hre.ethers.getContractFactory("CPCVoting");
    const voting = await CPCVoting.deploy(cpcAddress);
    await voting.waitForDeployment();
    const votingAddress = await voting.getAddress();
    console.log("Voting:", votingAddress);

    // Deploy OTC Contract
    console.log("Deploying OTC Contract...");
    const CPCOTC = await hre.ethers.getContractFactory("CPCOTC");
    const otc = await CPCOTC.deploy(cpcAddress, votingAddress);
    await otc.waitForDeployment();
    const otcAddress = await otc.getAddress();
    console.log("OTC:", otcAddress, "\n");

    // Test Voting
    console.log("Testing Voting System...");
    await cpcToken.connect(user3).approve(votingAddress, hre.ethers.parseEther("1"));
    await voting.connect(user3).becomeCandidate();
    console.log("User3 became candidate");

    await cpcToken.connect(user4).approve(votingAddress, hre.ethers.parseEther("1"));
    await voting.connect(user4).becomeCandidate();
    console.log("User4 became candidate");

    await voting.connect(user1).vote(user3.address);
    console.log("User1 voted for User3");

    const votes = await voting.votes(1, user3.address);
    console.log("User3 votes:", votes.toString());

    // Test OTC
    console.log("\nTesting OTC Platform...");
    const sellAmount = hre.ethers.parseEther("100");
    const price = hre.ethers.parseEther("0.01");
    
    await cpcToken.connect(user1).approve(otcAddress, sellAmount);
    await otc.connect(user1).createSellOrder(sellAmount, price, {
        value: hre.ethers.parseEther("0.001")
    });
    console.log("Created sell order");

    const buyValue = hre.ethers.parseEther("1");
    await otc.connect(user2).fillSellOrder(1, 0, { value: buyValue });
    console.log("Filled sell order");

    // Check fees
    const votingBalance = await hre.ethers.provider.getBalance(votingAddress);
    console.log("\nVoting contract balance:", hre.ethers.formatEther(votingBalance), "BNB");

    console.log("\nAll tests passed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
