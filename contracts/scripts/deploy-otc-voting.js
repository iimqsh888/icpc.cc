import hre from "hardhat";

async function main() {
    console.log("🚀 Deploying CPC OTC + Voting Contracts...\n");

    // Hardcoded addresses - IMMUTABLE after deployment
    const CPC_TOKEN = "0x5453C25CA8a0aFd9C6e73FF8c8C6Fe299D7F60C9";

    console.log("📋 Deployment Configuration:");
    console.log("  CPC Token:", CPC_TOKEN);
    console.log("  Creation Fee: 0.001 BNB → Voting Contract");
    console.log("  Trade Fee: 0.2% BNB → Voting Contract");
    console.log("  Voting Round: 30 days");
    console.log("");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "BNB\n");

    if (balance < hre.ethers.parseEther("0.05")) {
        console.error("❌ Insufficient balance for deployment");
        process.exit(1);
    }

    // Deploy voting contract first
    console.log("📦 Deploying CPCVoting contract...");
    const CPCVoting = await hre.ethers.getContractFactory("CPCVoting");
    const voting = await CPCVoting.deploy(CPC_TOKEN);
    
    await voting.waitForDeployment();
    const votingAddress = await voting.getAddress();
    
    console.log("✅ CPCVoting deployed!");
    console.log("📍 Voting Address:", votingAddress);
    console.log("");

    // Deploy OTC contract with voting address
    console.log("📦 Deploying CPCOTC contract...");
    const CPCOTC = await hre.ethers.getContractFactory("CPCOTC");
    const otc = await CPCOTC.deploy(CPC_TOKEN, votingAddress);
    
    await otc.waitForDeployment();
    const otcAddress = await otc.getAddress();
    
    console.log("✅ CPCOTC deployed!");
    console.log("📍 OTC Address:", otcAddress);
    console.log("");

    // Verify configuration
    console.log("🔍 Verifying configuration...");
    const cpcToken = await otc.cpcToken();
    const votingContract = await otc.votingContract();
    const tradeFee = await otc.TRADE_FEE_PERCENT();
    const creationFee = await otc.ORDER_CREATION_FEE();
    
    console.log("  OTC Configuration:");
    console.log("    CPC Token:", cpcToken);
    console.log("    Voting Contract:", votingContract);
    console.log("    Trade Fee:", tradeFee.toString(), "/ 10000 (", (Number(tradeFee) / 100).toFixed(2), "%)");
    console.log("    Creation Fee:", hre.ethers.formatEther(creationFee), "BNB");
    
    // Verify voting contract
    const votingCpcToken = await voting.cpcToken();
    const roundDuration = await voting.ROUND_DURATION();
    const candidateStake = await voting.CANDIDATE_STAKE();
    
    console.log("  Voting Configuration:");
    console.log("    CPC Token:", votingCpcToken);
    console.log("    Round Duration:", (Number(roundDuration) / 86400).toFixed(0), "days");
    console.log("    Candidate Stake:", hre.ethers.formatEther(candidateStake), "CPC");
    console.log("");

    // Verify addresses match
    if (cpcToken.toLowerCase() !== CPC_TOKEN.toLowerCase()) {
        console.error("❌ CPC Token address mismatch!");
        process.exit(1);
    }
    if (votingContract.toLowerCase() !== votingAddress.toLowerCase()) {
        console.error("❌ Voting Contract address mismatch!");
        process.exit(1);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Deployment Successful!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("📝 Contract Information:");
    console.log("  Network:", hre.network.name);
    console.log("  OTC Contract:", otcAddress);
    console.log("  Voting Contract:", votingAddress);
    console.log("  Block:", await hre.ethers.provider.getBlockNumber());
    console.log("");
    console.log("🔗 BSCScan Verification:");
    console.log(`  OTC: npx hardhat verify --network ${hre.network.name} ${otcAddress} "${CPC_TOKEN}" "${votingAddress}"`);
    console.log(`  Voting: npx hardhat verify --network ${hre.network.name} ${votingAddress} "${CPC_TOKEN}"`);
    console.log("");
    console.log("⚠️  IMPORTANT:");
    console.log("  1. Contracts are IMMUTABLE - no admin functions");
    console.log("  2. Fees and addresses CANNOT be changed");
    console.log("  3. Verify contracts on BSCScan");
    console.log("  4. Update frontend with contract addresses");
    console.log("  5. Test thoroughly before announcing");
    console.log("");
    console.log("📋 Frontend Configuration:");
    console.log("  Update otc/ui/otc.js and voting.js:");
    console.log(`  OTC: '${otcAddress}'`);
    console.log(`  VOTING: '${votingAddress}'`);
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
