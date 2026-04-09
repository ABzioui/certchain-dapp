import { useState, useCallback } from 'react';
import { useContracts } from './useContracts';
import type { CertificateStatus } from '../types';

export function useVerify() {
  const contracts = useContracts();
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle');
  const [result,  setResult]  = useState<CertificateStatus | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const verify = useCallback(async (certId: string) => {

    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      // 1. Récupérer le certificat principal
      const cert = await contracts.registry.getCertificate(certId);

      // 2. Vérifier la révocation externe (RevocationList)
      const isExternallyRevoked = await contracts.revocationList.isRevoked(certId);
      let revocationInfo = null;

      if (isExternallyRevoked) {
        const info = await contracts.revocationList.getRevocationInfo(certId);
        revocationInfo = {
          isRevoked:  true,
          revokedBy:  info.revokedBy,
          revokedAt:  info.revokedAt,
          reason:     info.reason,
        };
      }

      // 3. Récupérer le DID de l'émetteur
      let issuerDID = null;
      try {
        const did = await contracts.didRegistry.resolveDID(cert.issuer);
        issuerDID = {
          name:         did.name,
          ipfsDocHash:  did.ipfsDocHash,
          active:       did.active,
          registeredAt: did.registeredAt,
          updatedAt:    did.updatedAt,
        };
      } catch {
        // DID non enregistré — pas bloquant
      }

      const certificateData = {
        certId,
        certHash:   cert.certHash,
        issuer:     cert.issuer,
        issuedAt:   cert.issuedAt,
        revoked:    cert.revoked,
        nftTokenId: cert.nftTokenId,
        ipfsHash:   cert.ipfsHash,
      };

      const isValid = !cert.revoked && !isExternallyRevoked;

      setResult({ certificate: certificateData, revocationInfo, issuerDID, isValid });
      setStatus('found');
    } catch (err: any) {
      if (err?.message?.includes('cert not found')) {
        setStatus('not_found');
      } else {
        setStatus('error');
        setError(err?.message ?? 'Erreur inconnue');
      }
    }
  }, [contracts]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { verify, status, result, error, reset };
}