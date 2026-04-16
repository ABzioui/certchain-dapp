import { useState, useCallback, useEffect } from "react";
import { useContracts } from "./useContracts";
import { useWallet } from "../context/WalletContext";
import type { DIDDocument } from "../types";

export function useDID() {
  const contracts           = useContracts();
  const { wallet }          = useWallet();

  const [didDoc,      setDidDoc]      = useState<DIDDocument | null>(null);
  const [didUri,      setDidUri]      = useState<string | null>(null);
  const [loadStatus,  setLoadStatus]  = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");
  const [saveStatus,  setSaveStatus]  = useState<"idle" | "pending" | "mining" | "success" | "error">("idle");
  const [deactStatus, setDeactStatus] = useState<"idle" | "pending" | "mining" | "success" | "error">("idle");
  const [error,       setError]       = useState<string | null>(null);

  // ─── Charger le DID du wallet connecté ────────────────────────────────────
  const loadMyDID = useCallback(async () => {
    if (!contracts || !wallet.address) return;

    setLoadStatus("loading");
    setError(null);

    try {
      const uri = await contracts.didRegistry.getDIDUri(wallet.address);
      setDidUri(uri);

      const isActive = await contracts.didRegistry.isActiveDID(wallet.address);
      if (!isActive) {
        // DID non enregistré ou désactivé
        try {
          const doc = await contracts.didRegistry.resolveDID(wallet.address);
          setDidDoc({
            name:         doc.name,
            ipfsDocHash:  doc.ipfsDocHash,
            active:       doc.active,
            registeredAt: doc.registeredAt,
            updatedAt:    doc.updatedAt,
          });
          setLoadStatus("found");
        } catch {
          setLoadStatus("not_found");
        }
      } else {
        const doc = await contracts.didRegistry.resolveDID(wallet.address);
        setDidDoc({
          name:         doc.name,
          ipfsDocHash:  doc.ipfsDocHash,
          active:       doc.active,
          registeredAt: doc.registeredAt,
          updatedAt:    doc.updatedAt,
        });
        setLoadStatus("found");
      }
    } catch {
      setLoadStatus("not_found");
    }
  }, [contracts, wallet.address]);

  // Auto-charger quand le wallet est connecté
  useEffect(() => {
    if (wallet.address) loadMyDID();
  }, [wallet.address, loadMyDID]);

  // ─── Enregistrer / mettre à jour le DID ──────────────────────────────────
  const saveDID = useCallback(async (name: string, ipfsDocHash: string) => {
    if (!contracts) { setError("Wallet non connecté"); return; }

    setSaveStatus("pending");
    setError(null);

    try {
      const tx = await contracts.didRegistry.registerDID(name, ipfsDocHash);
      setSaveStatus("mining");
      await tx.wait();
      setSaveStatus("success");
      // Recharger
      await loadMyDID();
    } catch (err: any) {
      setSaveStatus("error");
      setError(err?.reason ?? err?.message ?? "Transaction échouée");
    }
  }, [contracts, loadMyDID]);

  // ─── Désactiver le DID ────────────────────────────────────────────────────
  const deactivateDID = useCallback(async () => {
    if (!contracts) { setError("Wallet non connecté"); return; }

    setDeactStatus("pending");
    setError(null);

    try {
      const tx = await contracts.didRegistry.deactivateDID();
      setDeactStatus("mining");
      await tx.wait();
      setDeactStatus("success");
      await loadMyDID();
    } catch (err: any) {
      setDeactStatus("error");
      setError(err?.reason ?? err?.message ?? "Transaction échouée");
    }
  }, [contracts, loadMyDID]);

  const resetSave  = useCallback(() => { setSaveStatus("idle");  setError(null); }, []);
  const resetDeact = useCallback(() => { setDeactStatus("idle"); setError(null); }, []);

  return {
    didDoc, didUri, loadStatus,
    saveStatus, deactStatus, error,
    saveDID, deactivateDID, loadMyDID,
    resetSave, resetDeact,
  };
}