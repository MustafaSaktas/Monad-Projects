import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

const hardhatChain = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
};

const OWNER_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

async function main() {
  const registry = process.env.REGISTRY;
  const market = process.env.MARKET;
  const approved = (process.env.APPROVED ?? "true").toLowerCase() === "true";

  if (!registry || !market) {
    console.log("Set env variables first:");
    console.log('$env:REGISTRY="0x..."');
    console.log('$env:MARKET="0x..."');
    return;
  }

  const artifact = await hre.artifacts.readArtifact("AgentRegistry");

  const publicClient = createPublicClient({
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const account = privateKeyToAccount(OWNER_PK);

  const walletClient = createWalletClient({
    account,
    chain: hardhatChain,
    transport: http("http://127.0.0.1:8545"),
  });

  const hash = await walletClient.writeContract({
    address: registry,
    abi: artifact.abi,
    functionName: "approveMarket",
    args: [market, approved],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  console.log("✅ Market approval set:", { market, approved });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});