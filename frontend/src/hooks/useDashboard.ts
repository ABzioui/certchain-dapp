import { useState, useCallback, useEffect } from 'react';
import { useContracts } from './useContracts';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';

export interface IssuedCert {
  certId:    string;
  certHash:  string;
  issuedAt:  bigint;
  revoked:   boolean;
  ipfsHash:  string;
  nftTokenId: bigint;
}

export function useDashboard() {
  const contracts                   = useContracts();
  const { wallet }                  = useWallet();
  const [certs,   setCerts]         = useState<IssuedCert[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error,   setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contracts || !wallet.address) return;

    setLoading(true);
    setError(null);

    try {
      // Récupérer tous les events CertificateIssued de cet émetteur
      const filter = contracts.registry.filters.CertificateIssued(
        null, null, wallet.address
      );
      const events = await contracts.registry.queryFilter(filter);

      const results: IssuedCert[] = await Promise.all(
        events.map(async (event: any) => {
          const certId = event.args.certId;
          try {
            const cert = await contracts.registry.getCertificate(certId);
            return {
              certId,
              certHash:   cert.certHash,
              issuedAt:   cert.issuedAt,
              revoked:    cert.revoked,
              ipfsHash:   cert.ipfsHash,
              nftTokenId: cert.nftTokenId,
            };
          } catch {
            return null;
          }
        })
      );

      setCerts(results.filter(Boolean).reverse() as IssuedCert[]);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [contracts, wallet.address]);

  useEffect(() => {
    if (wallet.address) load();
  }, [wallet.address, load]);

  return { certs, loading, error, reload: load };
}