import { hardhat } from "viem/chains"
import { createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import * as fs from "fs"

async function main() {
  console.log("=== testFlow start ===")

  const account = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  )

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  })

  const walletClient = createWalletClient({
    chain: hardhat,
    account,
    transport: http("http://127.0.0.1:8545"),
  })

  // ✅ Yeni deploy adresleri
  const PM = "0x0165878A594ca255338adfa4d48449f69242Eb8F"
  const TRE = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
  const GOV = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"

  // --- sanity ---
  const [govCode, pmCode, treCode] = await Promise.all([
    publicClient.getBytecode({ address: GOV }),
    publicClient.getBytecode({ address: PM }),
    publicClient.getBytecode({ address: TRE }),
  ])

  console.log("code GOV:", govCode && govCode !== "0x" ? "OK" : "MISSING")
  console.log("code PM :", pmCode && pmCode !== "0x" ? "OK" : "MISSING")
  console.log("code TRE:", treCode && treCode !== "0x" ? "OK" : "MISSING")

  if (!govCode || govCode === "0x" || !pmCode || pmCode === "0x" || !treCode || treCode === "0x") {
    console.log("❌ Contract code missing. Node reset olmuş. Redeploy gerekiyor.")
    return
  }

  // --- treasury fund (gerekirse) ---
  let treBal = await publicClient.getBalance({ address: TRE })
  console.log("Treasury balance:", treBal.toString())

  if (treBal < 10n * 10n ** 18n) {
    const fundHash = await walletClient.sendTransaction({
      to: TRE,
      value: 10n * 10n ** 18n,
    })
    await publicClient.waitForTransactionReceipt({ hash: fundHash })
    treBal = await publicClient.getBalance({ address: TRE })
    console.log("Treasury balance after funding:", treBal.toString())
  }

  // --- ABI ---
  const govArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Governor.sol/Governor.json", "utf8")
  )
  const govAbi = govArtifact.abi

  // --- owner kontrol ---
  const owner = (await publicClient.readContract({
    address: GOV,
    abi: govAbi,
    functionName: "owner",
    args: [],
  })) as `0x${string}`

  console.log("sender:", account.address)
  console.log("owner :", owner)

  // --- zamanlar (market önce kapanır, deadline sonra gelir) ---
  const block = await publicClient.getBlock()
  const now = block.timestamp

const marketCloseTime = now + 120n
const deadline = now + 300n // veya marketCloseTime + 60n gibi

  console.log("now:", now.toString())
  console.log("marketCloseTime:", marketCloseTime.toString())
  console.log("deadline:", deadline.toString())

  // --- simulate propose ---
  const sim = await publicClient.simulateContract({
    address: GOV,
    abi: govAbi,
    functionName: "propose",
    args: ["Invest in X", account.address, 1n * 10n ** 18n, deadline, marketCloseTime],
    account: account.address,
  })

  console.log("simulate OK, sending tx...")

// simulate request zaten doğru calldata içeriyor -> writeContract ile gönder
const txHash = await walletClient.writeContract(sim.request)

  console.log("TX:", txHash)

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log("Status:", receipt.status)

  // ✅ Type-safe nextId okuma
  const nextIdRaw = await publicClient.readContract({
    address: GOV,
    abi: govAbi,
    functionName: "nextProposalId",
    args: [],
  })
  const nextId = nextIdRaw as bigint

  const proposalId = nextId - 1n
  console.log("proposalId:", proposalId.toString())

  const proposal = await publicClient.readContract({
    address: GOV,
    abi: govAbi,
    functionName: "proposals",
    args: [proposalId],
  })

  console.log("Proposal:", proposal)
  console.log("=== DONE ===")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})