import React, { useState } from 'react';
import { useRevoke } from '../hooks/useRevoke';
import { useVerify } from '../hooks/useVerify';
import { useWallet } from '../context/WalletContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatHash, formatTimestamp, truncateAddress } from '../utils/crypto';

export function RevokePage() {
  const { wallet, connect }                 = useWallet();
  const { verify, status: verifyStatus,
          result, reset: resetVerify }       = useVerify();
  const { revoke, status: revokeStatus,
          txHash, error, reset: resetRevoke } = useRevoke();

  const [certId,    setCertId]    = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      resetRevoke();
      setConfirmed(false);
      verify(certId.trim());
    }
  };

  const handleRevoke = async () => {
    await revoke(certId.trim());
    resetVerify();
    setConfirmed(false);
  };

  const handleReset = () => {
    setCertId('');
    resetVerify();
    resetRevoke();
    setConfirmed(false);
  };

  if (wallet.status !== 'connected') {
    return (
      <div className="revoke-page">
        <div className="page-container">
          <Card variant="gold" animate className="wallet-gate-card">
            <div className="wallet-gate">
              <span className="wallet-gate__icon">⚠</span>
              <h3>Connexion requise</h3>
              <p>Seul l'émetteur original peut révoquer un certificat.</p>
              <Button variant="gold" size="lg" onClick={connect}>
                Connecter MetaMask
              </Button>
            </div>
          </Card>
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  // Succès
  if (revokeStatus === 'success') {
    return (
      <div className="revoke-page">
        <div className="page-container">
          <div className="revoke-success animate-fade-in-scale">
            <div className="revoke-success__icon">✓</div>
            <h2>Certificat révoqué</h2>
            <p>La révocation est permanente et enregistrée on-chain. Toute vérification ultérieure affichera le statut révoqué.</p>
            {txHash && (
              <Card variant="elevated">
                <div className="success-tx">
                  <span className="success-tx__label">Transaction</span>
                  <span className="success-tx__value mono">{formatHash(txHash, 16)}</span>
                </div>
              </Card>
            )}
            <Button variant="ghost" size="md" onClick={handleReset}>
              Révoquer un autre certificat
            </Button>
          </div>
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  return (
    <div className="revoke-page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header animate-fade-in">
          <div className="page-eyebrow">
            <span className="eyebrow-line" />
            Action irréversible
            <span className="eyebrow-line" />
          </div>
          <h1 className="page-title">Révoquer un certificat</h1>
          <p className="page-subtitle">
            La révocation est permanente et inscrite sur la blockchain.
            Elle ne peut pas être annulée.
          </p>
        </div>

        {/* Warning */}
        <Card variant="error" animate delay={100} className="revoke-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠</span>
            <div>
              <strong>Action irréversible</strong>
              <p>Une fois révoqué, le certificat sera marqué comme invalide de façon permanente sur la blockchain. Cette action ne peut pas être annulée.</p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card variant="elevated" animate delay={200}>
          <form onSubmit={handleSearch}>
            <div className="search-field">
              <Input
                label="Identifiant du certificat à révoquer"
                value={certId}
                onChange={e => { setCertId(e.target.value); resetVerify(); resetRevoke(); }}
                placeholder="0x..."
                icon={<span>◈</span>}
              />
              <Button
                variant="ghost"
                size="md"
                type="submit"
                loading={verifyStatus === 'loading'}
                disabled={!certId.trim()}
              >
                Rechercher
              </Button>
            </div>
          </form>
        </Card>

        {/* Not found */}
        {verifyStatus === 'not_found' && (
          <Card variant="error" animate>
            <div className="status-msg">
              <span>◎</span>
              <p>Certificat introuvable sur la blockchain.</p>
            </div>
          </Card>
        )}

        {/* Already revoked */}
        {verifyStatus === 'found' && result && !result.isValid && (
          <Card variant="error" animate>
            <div className="status-msg">
              <span>✗</span>
              <p>Ce certificat est déjà révoqué.</p>
            </div>
          </Card>
        )}

        {/* Not the issuer */}
        {verifyStatus === 'found' && result && result.isValid &&
         result.certificate?.issuer.toLowerCase() !== wallet.address?.toLowerCase() && (
          <Card variant="error" animate>
            <div className="status-msg">
              <span>⚠</span>
              <p>Vous n'êtes pas l'émetteur de ce certificat. Seul l'émetteur original peut le révoquer.</p>
            </div>
          </Card>
        )}

        {/* Found + is issuer + valid → show confirm */}
        {verifyStatus === 'found' && result && result.isValid &&
         result.certificate?.issuer.toLowerCase() === wallet.address?.toLowerCase() && (
          <div className="revoke-confirm animate-fade-in">
            <Card variant="elevated">
              <div className="cert-preview-section">
                <h3 className="cert-preview-title">
                  <span>◈</span> Certificat trouvé
                </h3>
                <div className="cert-detail-rows">
                  <CertDetailRow label="Cert ID"  value={formatHash(result.certificate!.certId, 12)} mono />
                  <CertDetailRow label="Hash"     value={formatHash(result.certificate!.certHash, 12)} mono />
                  <CertDetailRow label="Émis le"  value={formatTimestamp(result.certificate!.issuedAt)} />
                  <CertDetailRow label="Émetteur" value={truncateAddress(result.certificate!.issuer, 8)} mono />
                  <CertDetailRow label="Statut"   value={<Badge variant="valid" />} />
                </div>
              </div>
            </Card>

            {/* Confirmation checkbox */}
            <Card variant="error">
              <div className="confirm-section">
                <label className="confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                  />
                  <span>
                    Je confirme vouloir révoquer ce certificat de façon <strong>permanente et irréversible</strong>.
                  </span>
                </label>

                {error && (
                  <div className="revoke-error">
                    <span>⚠</span> {error}
                  </div>
                )}

                <Button
                  variant="danger"
                  size="lg"
                  disabled={!confirmed}
                  loading={revokeStatus === 'pending' || revokeStatus === 'mining'}
                  onClick={handleRevoke}
                >
                  {revokeStatus === 'pending' ? 'En attente de signature...'
                    : revokeStatus === 'mining' ? 'Révocation en cours...'
                    : 'Révoquer définitivement'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
      <style>{STYLES}</style>
    </div>
  );
}

function CertDetailRow({ label, value, mono = false }: {
  label: string; value: React.ReactNode; mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '12px', color: 'var(--white-40)' }}>{label}</span>
      {typeof value === 'string' ? (
        <span style={{ fontSize: '13px', color: 'var(--white-70)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
          {value}
        </span>
      ) : value}
    </div>
  );
}

const STYLES = `
  .revoke-page {
    padding-top: calc(64px + var(--space-12));
    padding-bottom: var(--space-20);
  }

  .page-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .page-header { text-align: center; margin-bottom: var(--space-2); }

  .page-eyebrow {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--error); margin-bottom: var(--space-4);
  }

  .eyebrow-line { width: 32px; height: 1px; background: var(--error); opacity: 0.4; }

  .page-title {
    font-size: clamp(28px, 4vw, 44px); font-weight: 300;
    color: var(--white); margin-bottom: var(--space-4);
  }

  .page-subtitle {
    font-size: 15px; color: var(--white-40);
    max-width: 480px; margin: 0 auto; line-height: 1.7;
  }

  /* Warning */
  .warning-content {
    display: flex; gap: var(--space-4); align-items: flex-start;
  }

  .warning-icon { font-size: 20px; color: var(--error); flex-shrink: 0; margin-top: 2px; }

  .warning-content strong { display: block; color: var(--white); margin-bottom: 4px; font-size: 14px; }
  .warning-content p { font-size: 13px; color: var(--white-40); margin: 0; line-height: 1.6; }

  /* Search */
  .search-field {
    display: flex; gap: var(--space-4); align-items: flex-end;
  }
  .search-field > *:first-child { flex: 1; }

  /* Status messages */
  .status-msg {
    display: flex; align-items: center; gap: var(--space-4);
    padding: var(--space-2) 0; font-size: 14px; color: var(--white-40);
  }
  .status-msg span { font-size: 20px; color: var(--error); }

  /* Cert preview */
  .cert-preview-title {
    font-family: var(--font-mono); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--gold); margin-bottom: var(--space-4);
    display: flex; align-items: center; gap: 8px;
  }

  .cert-detail-rows { display: flex; flex-direction: column; }

  /* Confirm */
  .confirm-section {
    display: flex; flex-direction: column; gap: var(--space-5);
  }

  .confirm-checkbox {
    display: flex; align-items: flex-start; gap: var(--space-3);
    cursor: pointer; font-size: 14px; color: var(--white-70); line-height: 1.6;
  }

  .confirm-checkbox input[type="checkbox"] {
    width: 16px; height: 16px; margin-top: 3px;
    accent-color: var(--error); cursor: pointer; flex-shrink: 0;
  }

  .confirm-checkbox strong { color: var(--error); }

  .revoke-error {
    font-size: 13px; color: var(--error);
    font-family: var(--font-mono);
    display: flex; align-items: center; gap: 8px;
  }

  /* Success */
  .revoke-success {
    max-width: 500px; margin: 0 auto;
    text-align: center; padding: var(--space-10) 0;
    display: flex; flex-direction: column;
    align-items: center; gap: var(--space-5);
  }

  .revoke-success__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--error-dim); border: 2px solid rgba(255,77,109,0.4);
    color: var(--error); font-size: 32px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 40px rgba(255,77,109,0.15);
  }

  .revoke-success h2 {
    font-family: var(--font-display); font-size: 32px;
    font-weight: 300; color: var(--white);
  }

  .revoke-success p {
    font-size: 14px; color: var(--white-40);
    line-height: 1.7; max-width: 400px;
  }

  .success-tx {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px;
  }
  .success-tx__label { color: var(--white-40); }
  .success-tx__value { font-family: var(--font-mono); color: var(--white-70); font-size: 12px; }

  /* Wallet gate */
  .wallet-gate-card { max-width: 480px; margin: 80px auto 0; }
  .wallet-gate {
    text-align: center; padding: var(--space-8) 0;
    display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
  }
  .wallet-gate__icon { font-size: 40px; color: var(--error); }
  .wallet-gate h3 { font-family: var(--font-display); font-size: 22px; color: var(--white); }
  .wallet-gate p { font-size: 14px; color: var(--white-40); }

  .revoke-confirm { display: flex; flex-direction: column; gap: var(--space-4); }

  .mono { font-family: var(--font-mono); }
`;