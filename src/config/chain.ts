export type ChainConfig = {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export const MONAD: ChainConfig = {
  chainId: 10143, // örnek
  chainIdHex: "0x279F",
  chainName: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://rpc.monad.xyz"], // placeholder
  blockExplorerUrls: ["https://monadvision.com"] // placeholder
};

export const TARGET_CHAIN = MONAD;

export function explorerTxUrl(txHash: string): string {
  const base = TARGET_CHAIN.blockExplorerUrls?.[0] ?? "";
  if (!base) return "";
  // bazı explorer'lar /tx/ kullanır, bazıları ?tx=
  return `${base.replace(/\/$/, "")}/tx/${txHash}`;
}