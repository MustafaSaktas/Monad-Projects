import { TARGET_CHAIN } from "../config/chain";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { TARGET_CHAIN } from "../config/chains";

type Eip1193Provider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string>("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>("");

  const hasProvider = typeof window !== "undefined" && !!window.ethereum;

  const provider = useMemo(() => {
    if (!hasProvider) return null;
    return new ethers.BrowserProvider(window.ethereum as any);
  }, [hasProvider]);

  const isCorrectNetwork = chainId === TARGET_CHAIN.chainId;

  const refresh = useCallback(async () => {
    if (!provider) return;
    try {
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);

      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));

      const bal = await provider.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (e: any) {
      // user not connected is normal
    }
  }, [provider]);

  const connect = useCallback(async () => {
    setError("");
    if (!hasProvider || !window.ethereum) {
      setError("MetaMask bulunamadı.");
      return;
    }
    setIsConnecting(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Cüzdan bağlantı hatası");
    } finally {
      setIsConnecting(false);
    }
  }, [hasProvider, refresh]);

  const switchToTargetChain = useCallback(async () => {
    setError("");
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN.chainIdHex }]
      });
      await refresh();
    } catch (switchErr: any) {
      // chain not added
      if (switchErr?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: TARGET_CHAIN.chainIdHex,
                chainName: TARGET_CHAIN.chainName,
                rpcUrls: TARGET_CHAIN.rpcUrls,
                nativeCurrency: TARGET_CHAIN.nativeCurrency,
                blockExplorerUrls: TARGET_CHAIN.blockExplorerUrls
              }
            ]
          });
          await refresh();
        } catch (addErr: any) {
          setError(addErr?.message ?? "Ağ ekleme hatası");
        }
      } else {
        setError(switchErr?.message ?? "Ağ değiştirme hatası");
      }
    }
  }, [refresh]);

  useEffect(() => {
    if (!window.ethereum?.on) return;

    const onAccountsChanged = () => refresh();
    const onChainChanged = () => refresh();

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);

    // initial refresh (connected session varsa)
    refresh();

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refresh]);

  return {
    hasProvider,
    provider,
    address,
    chainId,
    balance,
    isCorrectNetwork,
    isConnecting,
    error,
    connect,
    switchToTargetChain,
    refresh
  };
}