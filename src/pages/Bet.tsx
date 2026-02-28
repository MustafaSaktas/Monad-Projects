import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useGovernor } from "../hooks/useGovernor";
import { TxStatus, TxState } from "../components/TxStatus";

export function Bet() {
  const { address, isCorrectNetwork } = useWallet();
  const { writeContract, readContract } = useGovernor();

  const [proposalId, setProposalId] = useState("1");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [stake, setStake] = useState("0.001");

  const [yesRatio, setYesRatio] = useState<string>("-");
  const [tx, setTx] = useState<TxState>({ pending: false });

  const canSubmit = useMemo(() => {
    if (!address || !isCorrectNetwork) return false;
    const idOk = /^\d+$/.test(proposalId);
    const s = Number(stake);
    return idOk && s > 0;
  }, [address, isCorrectNetwork, proposalId, stake]);

  async function refreshRatio() {
    if (!readContract) return;
    try {
      const r: bigint = await readContract.getYesRatio(BigInt(proposalId));
      // ratio 1e18 => %
      const pct = Number(ethers.formatUnits(r, 16)) / 100; // basit: 1e18 -> 100%
      setYesRatio(`${pct.toFixed(2)}%`);
    } catch {
      setYesRatio("-");
    }
  }

  async function onBet() {
    if (!writeContract) return;
    setTx({ pending: true });
    try {
      const c = await writeContract.instance();
      const value = ethers.parseEther(stake);
      const txResp = await c.placeBet(BigInt(proposalId), side === "YES", { value });
      setTx({ pending: true, hash: txResp.hash });
      await txResp.wait();
      setTx({ pending: false, hash: txResp.hash, success: true });
      await refreshRatio();
    } catch (e: any) {
      setTx({ pending: false, error: e?.shortMessage ?? e?.message ?? "Tx failed" });
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2>Bet</h2>

      <label>Proposal ID</label>
      <input
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        value={proposalId}
        onChange={(e) => setProposalId(e.target.value)}
      />

      <label>Side</label>
      <div style={{ display: "flex", gap: 8, margin: "6px 0 12px" }}>
        <button
          onClick={() => setSide("YES")}
          style={{ fontWeight: side === "YES" ? 700 : 400 }}
        >
          YES
        </button>
        <button
          onClick={() => setSide("NO")}
          style={{ fontWeight: side === "NO" ? 700 : 400 }}
        >
          NO
        </button>
        <button onClick={refreshRatio} style={{ marginLeft: "auto" }}>
          Refresh YES%
        </button>
      </div>

      <div style={{ fontSize: 13, marginBottom: 12 }}>YES ratio: {yesRatio}</div>

      <label>Stake (native)</label>
      <input
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        value={stake}
        onChange={(e) => setStake(e.target.value)}
      />

      <button onClick={onBet} disabled={!canSubmit || tx.pending}>
        {tx.pending ? "Submitting…" : "Place Bet"}
      </button>

      <TxStatus state={tx} />
    </div>
  );
}