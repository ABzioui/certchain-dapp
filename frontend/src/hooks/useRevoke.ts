import { useState, useCallback } from 'react';
import { useContracts } from './useContracts';

export function useRevoke() {
  const contracts = useContracts();
  const [status, setStatus] = useState<'idle' | 'pending' | 'mining' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const revoke = useCallback(async (certId: string) => {
    if (!contracts) { setError('Wallet non connecté'); return; }

    setStatus('pending');
    setError(null);
    setTxHash(null);

    try {
      const tx = await contracts.registry.revokeCertificate(certId);
      setStatus('mining');
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err?.reason ?? err?.message ?? 'Transaction échouée');
    }
  }, [contracts]);

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);

  return { revoke, status, txHash, error, reset };
}