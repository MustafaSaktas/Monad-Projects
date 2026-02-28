import { explorerTxUrl } from "../config/chains";

export type TxState = {
  pending: boolean;
  hash?: string;
  success?: boolean;
  error?: string;
};

export function TxStatus({ state }: { state: TxState }) {
  if (!state.hash && !state.error && !state.pending && !state.success) return null;

  const txUrl = state.hash ? explorerTxUrl(state.hash) : "";

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 8,
        background: "#fafafa",
        fontSize: 13
      }}
    >
      {state.pending ? <div>Tx pending…</div> : null}
      {state.success ? <div style={{ color: "green" }}>Success ✅</div> : null}
      {state.error ? <div style={{ color: "crimson" }}>Error: {state.error}</div> : null}

      {state.hash ? (
        <div style={{ marginTop: 6 }}>
          Tx:{" "}
          {txUrl ? (
            <a href={txUrl} target="_blank" rel="noreferrer">
              {state.hash}
            </a>
          ) : (
            state.hash
          )}
        </div>
      ) : null}
    </div>
  );
}