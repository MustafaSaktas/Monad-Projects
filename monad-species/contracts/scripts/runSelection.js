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
  const artifact = await hre.artifacts.readArtifact("AgentRegistry");

  const publicClient = createPublicClient({
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const account = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );

  const walletClient = createWalletClient({
    account,
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  // 1️⃣ nextAgentId oku
  const nextAgentId = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "nextAgentId",
  });

  console.log("Total agents:", nextAgentId.toString());

  let lowestPerformance = Number.MAX_SAFE_INTEGER;
  let lowestAgentId = null;

  // 2️⃣ Tüm agent’ları dolaş
  for (let i = 0; i < Number(nextAgentId); i++) {
    const agent = await publicClient.readContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: "agents",
      args: [i],
    });

    const performance = Number(agent[2]);
    const alive = agent[3];

    if (alive && performance < lowestPerformance) {
      lowestPerformance = performance;
      lowestAgentId = i;
    }
  }

  if (lowestAgentId === null) {
    console.log("No alive agents found.");
    return;
  }

  console.log("Lowest performing agent:", lowestAgentId);
  console.log("Performance:", lowestPerformance);

  // 3️⃣ Slash et
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: "slashAgent",
    args: [lowestAgentId],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  console.log("Agent", lowestAgentId, "has been slashed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});