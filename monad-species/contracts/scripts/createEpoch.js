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

  if (!market) {
    console.log('Set $env:MARKET="0x..." and $env:EPOCH_ID=0');
    return;
  }

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

  const currentBlock = await publicClient.getBlockNumber();
  const endBlock = currentBlock + 20n;

  const hash = await walletClient.writeContract({
    address: market,
    abi: artifact.abi,
    functionName: "createEpoch",
    args: [epochId, endBlock],
  });

  await publicClient.waitForTransactionReceipt({ hash });

  console.log("✅ Epoch created:", { epochId, endBlock: endBlock.toString() });
}

main();