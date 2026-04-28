import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

const chain = {
  id: 31337,
  name: "Hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
};

const OWNER_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

async function main() {
  const market = process.env.MARKET;
  const epochId = Number(process.env.EPOCH_ID);
  const outcomeYes = process.env.OUTCOME === "YES";

  const artifact = await hre.artifacts.readArtifact("PredictionMarket");

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const account = privateKeyToAccount(OWNER_PK);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  const hash = await walletClient.writeContract({
    address: market,
    abi: artifact.abi,
    functionName: "resolveEpoch",
    args: [epochId, outcomeYes],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  console.log("✅ Epoch resolved:", { epochId, outcomeYes });
}

main();