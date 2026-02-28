import { useMemo } from "react";
import { ethers } from "ethers";
import { GOVERNOR_ABI, GOVERNOR_ADDRESS } from "../config/contracts";
import { useWallet } from "./useWallet";

export function useGovernor() {
  const { provider, isCorrectNetwork } = useWallet();

  const readContract = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);
  }, [provider]);

  const writeContract = useMemo(() => {
    if (!provider || !isCorrectNetwork) return null;
    // signer, tx göndermek için şart
    const signerPromise = provider.getSigner();
    // ethers Contract signer async istemiyor; proxy pattern:
    // burada basitçe async wrapper döndürelim
    return {
      async instance() {
        const signer = await signerPromise;
        return new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);
      }
    };
  }, [provider, isCorrectNetwork]);

  return { readContract, writeContract };
}