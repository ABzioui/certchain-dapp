import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { hashCertData } from '../utils/crypto';
import type { IssueCertFormData } from '../types';

interface IssueResult {
  certId:  string;
  txHash:  string;
}

export function useIssue() {
  const contracts = useContracts();
  const [status, setStatus] = useState<'idle' | 'hashing' | 'pending' | 'mining' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<IssueResult | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const issue = useCallback(async (formData: IssueCertFormData) => {
    if (!contracts) { setError('Wallet non connecté'); return; }

    setStatus('hashing');
    setError(null);
    setResult(null);

    try {
      // 1. Calculer le SHA-256 des données hors chaîne
      const certHash = await hashCertData(formData);

      setStatus('pending');

      // 2. Appeler le smart contract
      const tx = await contracts.registry.issueCertificate(certHash, formData.ipfsHash || '');

      setStatus('mining');

      // 3. Attendre la confirmation
      const receipt = await tx.wait();

      // 4. Extraire le certId depuis l'event
      const event = receipt?.logs
        .map((log: any) => {
          try { return contracts.registry.interface.parseLog(log); }
          catch { return null; }
        })
        .find((e: any) => e?.name === 'CertificateIssued');

      const certId = event?.args?.certId ?? '';
      setResult({ certId, txHash: receipt.hash });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err?.reason ?? err?.message ?? 'Transaction échouée');
    }
  }, [contracts]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { issue, status, result, error, reset };
}