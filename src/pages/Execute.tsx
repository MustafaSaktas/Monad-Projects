import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useGovernor } from "../hooks/useGovernor";
import { TxStatus, TxState } from "../components/TxStatus";

type ProposalView = {
  id: string;
  recipient: string;
  amount: string;
  executed: boolean;
  description: string;
};

export function Execute() {
  const { address, isCorrectNetwork } = useWallet();
  const { readContract, writeContract } = useGovernor();

  const [proposalId, setProposalId] = useState("1");
  const [canExecute, setCanExecute] = useState<boolean | null>(null);
  const [proposal, setProposal] = useState<ProposalView | null>(null);
  const [tx, setTx] = useState<TxState>({ pending: false });

  const canSubmit = useMemo(() => {
    if (!address || !isCorrectNetwork) return false;
    return /^\d+$/.test(proposalId);
  }, [address, isCorrectNetwork, proposalId]);

  async function load() {
    if (!readContract) return;
    try {
      const [id, recipient, amount, executed, description] = await readContract.getProposal(
        BigInt(proposalId)
      );
      setProposal({
        id: id.toString(),
        recipient,
        amount: ethers.formatEther(amount),
        executed,
        description
      });

      const ce: boolean = await readContract.canExecute(BigInt(proposalId));
      setCanExecute(ce);
    } catch (e) {
      setProposal(null);
      setCanExecute(null);
    }
  }

  async function onExecute() {
    if (!writeContract) return;
    setTx({ pending: true });
    try {
      const c = await writeContract.instance();
      const txResp = await c.executeProposal(BigInt(proposalId));
      setTx({ pending: true, hash: txResp.hash });
      await txResp.wait();
      setTx({ pending: false, hash: txResp.hash, success: true });
      await load();
    } catch (e: any) {
      setTx({ pending: false, error: e?.shortMessage ?? e?.message ?? "Tx failed" });
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>Execute</h2>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={{ width: 160, padding: 8 }}
          value={proposalId}
          onChange={(e) => setProposalId(e.target.value)}
          placeholder="Proposal ID"
        />
        <button onClick={load} disabled={!canSubmit}>
          Load
        </button>
      </div>

      {proposal ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 8
          }}
        >
          <div><b>ID:</b> {proposal.id}</div>
          <div><b>Recipient:</b> {proposal.recipient}</div>
          <div><b>Amount:</b> {proposal.amount}</div>
          <div><b>Executed:</b> {proposal.executed ? "Yes" : "No"}</div>
          <div><b>Description:</b> {proposal.description}</div>
          <div style={{ marginTop: 8 }}>
            <b>Can Execute:</b>{" "}
            {canExecute === null ? "-" : canExecute ? "Yes ✅" : "No ❌"}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
          Proposal yüklenmedi.
        </div>
      )}

      <button
        style={{ marginTop: 12 }}
        onClick={onExecute}
        disabled={!canSubmit || tx.pending || !canExecute}
      >
        {tx.pending ? "Executing…" : "Execute"}
      </button>

      <TxStatus state={tx} />
    </div>
  );
}