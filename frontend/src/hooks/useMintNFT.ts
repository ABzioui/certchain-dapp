import { useState, useCallback } from "react";
import { useContracts } from "./useContracts";

interface MintResult {
  tokenId: bigint;
  txHash:  string;
}

export function useMintNFT() {
  const contracts = useContracts();
  const [status,  setStatus]  = useState<"idle" | "pending" | "mining" | "success" | "error">("idle");
  const [result,  setResult]  = useState<MintResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const mint = useCallback(async (
    recipientAddr: string,
    certId:        string,
    ipfsUri:       string = ""
  ) => {
    if (!contracts) { setError("Wallet non connecté"); return; }

    setStatus("pending");
    setError(null);
    setResult(null);

    try {
      // 1. Mint le NFT
      const tx = await contracts.certNFT.mintCertNFT(
        recipientAddr,
        certId,
        ipfsUri || `ipfs://certchain/${certId}`
      );
      setStatus("mining");
      const receipt = await tx.wait();

      // 2. Extraire le tokenId depuis l'event CertNFTMinted
      const event = receipt?.logs
        .map((log: any) => {
          try { return contracts.certNFT.interface.parseLog(log); }
          catch { return null; }
        })
        .find((e: any) => e?.name === "CertNFTMinted");

      const tokenId: bigint = event?.args?.tokenId ?? 0n;

      // 3. Lier le NFT au certificat dans le registry
      const tx2 = await contracts.registry.linkNFT(certId, tokenId);
      await tx2.wait();

      setResult({ tokenId, txHash: receipt.hash });
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err?.reason ?? err?.message ?? "Mint échoué");
    }
  }, [contracts]);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { mint, status, result, error, reset };
}