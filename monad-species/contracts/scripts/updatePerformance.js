import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

const hardhatChain = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
};

async function main() {
  // Environment variable'ları al
  const agentId = parseInt(process.env.AGENT_ID);
  const score = parseInt(process.env.SCORE);

  if (isNaN(agentId) || isNaN(score)) {
    console.log("❌ AGENT_ID veya SCORE eksik.");
    console.log("PowerShell kullanım:");
    console.log("$env:AGENT_ID=0");
    console.log("$env:SCORE=100");
    console.log("npx hardhat run scripts/updatePerformance.js --network localhost");
    return;
  }

  const artifact = await hre.artifacts.readArtifact("AgentRegistry");

  const publicClient = createPublicClient({
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  // Owner private key (Hardhat Account #0)
  const account = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );

  const walletClient = createWalletClient({
    account,
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // deploy adresini kontrol et

  console.log(`Updating performance: Agent ${agentId} → ${score}`);

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "updatePerformance",
    args: [agentId, score],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  console.log("✅ Performance updated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});