import { createPublicClient, http } from "viem";
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
  const agentId = parseInt(process.env.AGENT_ID);

  if (isNaN(agentId)) {
    console.log("❌ AGENT_ID environment variable girilmedi.");
    console.log("PowerShell örnek:");
    console.log('$env:AGENT_ID=0');
    console.log("npx hardhat run scripts/readAgent.js --network localhost");
    return;
  }

  const artifact = await hre.artifacts.readArtifact("AgentRegistry");

  const publicClient = createPublicClient({
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const agent = await publicClient.readContract({
    address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    abi: artifact.abi,
    functionName: "agents",
    args: [agentId],
  });

  console.log(`\n📦 Agent #${agentId} state:`);
  console.log("Owner:       ", agent[0]);
  console.log("Stake (wei): ", agent[1].toString());
  console.log("Performance: ", agent[2].toString());
  console.log("Alive:       ", agent[3]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});