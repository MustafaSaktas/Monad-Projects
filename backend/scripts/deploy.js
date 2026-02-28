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

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("AgentRegistry deployed to:", receipt.contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});