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

async function deployContract(publicClient, walletClient, name, args = []) {
  const artifact = await hre.artifacts.readArtifact(name);

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.contractAddress;
}

async function main() {
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

  const registryAddr = await deployContract(publicClient, walletClient, "AgentRegistry");
  console.log("AgentRegistry:", registryAddr);

  const marketAddr = await deployContract(publicClient, walletClient, "PredictionMarket", [registryAddr]);
  console.log("PredictionMarket:", marketAddr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});