import { BrowserProvider } from "ethers";

export const MONAD_TESTNET = {
  chainIdDec: 10143,
  chainIdHex: "0x279F",
  chainName: "Monad Testnet",
  rpcUrls: ["https://testnet-rpc.monad.xyz/"],
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  // Explorer URL'yi dokümandan/alttaki add-network sayfasından ekleyebilirsin.
  // blockExplorerUrls: ["https://..."],
};

export async function getProvider() {
  if (!window.ethereum) throw new Error("Wallet bulunamadı (MetaMask vs).");
  return new BrowserProvider(window.ethereum);
}

export async function connectWalletAndEnsureMonad() {
  const provider = await getProvider();

  // önce connect
  await window.ethereum.request({ method: "eth_requestAccounts", params: [] });

  // ağ kontrolü
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  if (currentChainId !== MONAD_TESTNET.chainIdHex) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET.chainIdHex }],
      });
    } catch (e: any) {
      // ağ ekli değilse eklemeyi dene
      if (e?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [MONAD_TESTNET],
        });
      } else {
        throw e;
      }
    }
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}