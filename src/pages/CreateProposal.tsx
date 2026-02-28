import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useGovernor } from "../hooks/useGovernor";
import { TxStatus, TxState } from "../components/TxStatus";

export function CreateProposal() {
  const { address, isCorrectNetwork } = useWallet();
  const { writeContract } = useGovernor();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.01"); // native coin
  const [description, setDescription] = useState("Treasury transfer demo");

  const [tx, setTx] = useState<TxState>({ pending: false });

  const canSubmit = useMemo(() => {
    if (!address || !isCorrectNetwork) return false;
    if (!ethers.isAddress(recipient)) return false;
    const n = Number(amount);
    return n > 0 && description.trim().length > 0;
  }, [address, isCorrectNetwork, recipient, amount, description]);

  async function onCreate() {
    if (!writeContract) return;
    setTx({ pending: true });
    try {
      const c = await writeContract.instance();
      const amountWei = ethers.parseEther(amount);
      const txResp = await c.createProposal(recipient, amountWei, description);
      setTx({ pending: true, hash: txResp.hash });

      const receipt = await txResp.wait();
      setTx({ pending: false, hash: txResp.hash, success: true });

      // Eğer event parse etmek istersen:
      // for (const log of receipt.logs) { ... }
      void receipt;
    } catch (e: any) {
      setTx({ pending: false, error: e?.shortMessage ?? e?.message ?? "Tx failed" });
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2>Create Proposal</h2>
      <p style={{ fontSize: 13, color: "#666" }}>
        Proposal: treasury’den recipient’e native coin transfer önerisi.
      </p>

      <label>Recipient</label>
      <input
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        placeholder="0x..."
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <label>Amount (native)</label>
      <input
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <label>Description</label>
      <input
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={onCreate} disabled={!canSubmit || tx.pending}>
        {tx.pending ? "Submitting…" : "Create"}
      </button>

      <TxStatus state={tx} />
    </div>
  );
}