import { useWallet } from "../hooks/useWallet";
import { TARGET_CHAIN } from "../config/chains";

function shortAddr(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export function ConnectButton() {
  const {
    hasProvider,
    address,
    chainId,
    balance,
    isCorrectNetwork,
    isConnecting,
    error,
    connect,
    switchToTargetChain
  } = useWallet();

  if (!hasProvider) {
    return <div>MetaMask yok</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!address ? (
          <button onClick={connect} disabled={isConnecting}>
            {isConnecting ? "Connecting…" : "Connect"}
          </button>
        ) : !isCorrectNetwork ? (
          <button onClick={switchToTargetChain}>
            Switch to {TARGET_CHAIN.chainName} (current: {chainId})
          </button>
        ) : (
          <div style={{ fontSize: 13 }}>
            {shortAddr(address)} · {Number(balance).toFixed(4)} {TARGET_CHAIN.nativeCurrency.symbol}
          </div>
        )}
      </div>
      {error ? <div style={{ color: "crimson", fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}