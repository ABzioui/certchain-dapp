import React, { useState, useEffect } from 'react';
import { useVerify } from '../hooks/useVerify';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { truncateAddress, formatTimestamp, formatHash } from '../utils/crypto';

// Lire le certId depuis l'URL si présent
function getCertIdFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('certId') ?? '';
}

export function VerifyPage() {
  const { verify, status, result, error, reset } = useVerify();
  const [certId, setCertId] = useState(getCertIdFromUrl());

  useEffect(() => {
    const fromUrl = getCertIdFromUrl();
    if (fromUrl) {
      setCertId(fromUrl);
      verify(fromUrl);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) verify(certId.trim());
  };

  const handleReset = () => {
    reset();
    setCertId('');
  };

  return (
    <div className="verify-page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header animate-fade-in">
          <div className="page-eyebrow">
            <span className="eyebrow-line" />
            Vérification on-chain
            <span className="eyebrow-line" />
          </div>
          <h1 className="page-title">Authentifier un certificat</h1>
          <p className="page-subtitle">
            Entrez l'identifiant du certificat ou scannez un QR Code
            pour vérifier son authenticité directement sur la blockchain.
          </p>
        </div>

        {/* Search Form */}
        <Card className="verify-search animate-fade-in delay-100">
          <form onSubmit={handleSubmit}>
            <div className="verify-search__field">
              <Input
                label="Identifiant du certificat (CertID)"
                value={certId}
                onChange={e => { setCertId(e.target.value); reset(); }}
                placeholder="0x4a2f8e91c3b5d07a1f6e924..."
                icon={<span>◈</span>}
                hint="Format : hash hexadécimal 0x... généré lors de l'émission"
              />
              <Button
                variant="gold"
                size="md"
                type="submit"
                loading={status === 'loading'}
                disabled={!certId.trim()}
              >
                Vérifier
              </Button>
            </div>
          </form>
        </Card>

        {/* Loading */}
        {status === 'loading' && (
          <div className="verify-loading animate-fade-in">
            <div className="verify-loading__spinner" />
            <div className="verify-loading__text">
              <span>Interrogation de la blockchain</span>
              <span className="verify-loading__dots">...</span>
            </div>
          </div>
        )}

        {/* Not Found */}
        {status === 'not_found' && (
          <Card variant="error" animate>
            <div className="verify-notfound">
              <span className="verify-notfound__icon">◎</span>
              <h3>Certificat introuvable</h3>
              <p>Aucun certificat ne correspond à cet identifiant sur la blockchain.</p>
              <Button variant="ghost" size="sm" onClick={handleReset}>Nouvelle recherche</Button>
            </div>
          </Card>
        )}

        {/* Error */}
        {status === 'error' && error && (
          <Card variant="error" animate>
            <div className="verify-notfound">
              <span className="verify-notfound__icon">⚠</span>
              <h3>Erreur de connexion</h3>
              <p>{error}</p>
              <Button variant="ghost" size="sm" onClick={handleReset}>Réessayer</Button>
            </div>
          </Card>
        )}

        {/* Result */}
        {status === 'found' && result && (
          <div className="verify-result animate-fade-in">

            {/* Status Banner */}
            <div className={`verify-banner ${result.isValid ? 'verify-banner--valid' : 'verify-banner--invalid'}`}>
              <div className="verify-banner__icon">
                {result.isValid ? '✓' : '✗'}
              </div>
              <div className="verify-banner__content">
                <div className="verify-banner__title">
                  {result.isValid ? 'Certificat authentique' : 'Certificat révoqué'}
                </div>
                <div className="verify-banner__subtitle">
                  {result.isValid
                    ? 'Ce certificat est valide et enregistré sur la blockchain Ethereum.'
                    : 'Ce certificat a été révoqué. Il n\'est plus reconnu comme valide.'}
                </div>
              </div>
              <Badge
                variant={result.isValid ? 'valid' : 'revoked'}
                pulse={result.isValid}
              />
            </div>

            {/* Certificate Details */}
            <div className="verify-grid">
              <Card variant="elevated" animate delay={100}>
                <div className="detail-section">
                  <h3 className="detail-section__title">
                    <span className="detail-section__icon">◈</span>
                    Données du certificat
                  </h3>
                  <div className="detail-rows">
                    <DetailRow label="Cert ID"     value={formatHash(result.certificate!.certId, 12)} mono />
                    <DetailRow label="Hash"        value={formatHash(result.certificate!.certHash, 12)} mono />
                    <DetailRow label="Date d'émission" value={formatTimestamp(result.certificate!.issuedAt)} />
                    <DetailRow label="NFT Token"   value={result.certificate!.nftTokenId > 0n ? `#${result.certificate!.nftTokenId}` : 'Non lié'} mono />
                    <DetailRow label="IPFS"        value={result.certificate!.ipfsHash || '—'} mono />
                    <DetailRow label="Statut"      value={
                      <Badge variant={result.isValid ? 'valid' : 'revoked'} />
                    } />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" animate delay={200}>
                <div className="detail-section">
                  <h3 className="detail-section__title">
                    <span className="detail-section__icon">⬡</span>
                    Établissement émetteur
                  </h3>
                  <div className="detail-rows">
                    <DetailRow label="Adresse ETH"
                      value={truncateAddress(result.certificate!.issuer, 8)} mono />
                    {result.issuerDID ? (
                      <>
                        <DetailRow label="Nom"      value={result.issuerDID.name} />
                        <DetailRow label="DID"      value={`did:ethr:${truncateAddress(result.certificate!.issuer)}`} mono />
                        <DetailRow label="Statut DID" value={
                          <Badge variant={result.issuerDID.active ? 'gold' : 'revoked'}
                            label={result.issuerDID.active ? 'ACTIF' : 'INACTIF'} />
                        } />
                        <DetailRow label="Enregistré le"
                          value={formatTimestamp(result.issuerDID.registeredAt)} />
                      </>
                    ) : (
                      <DetailRow label="DID" value="Non enregistré" />
                    )}
                  </div>
                </div>
              </Card>

              {/* Revocation Info if revoked */}
              {result.revocationInfo && (
                <Card variant="error" animate delay={300}>
                  <div className="detail-section">
                    <h3 className="detail-section__title">
                      <span className="detail-section__icon">⚠</span>
                      Informations de révocation
                    </h3>
                    <div className="detail-rows">
                      <DetailRow label="Révoqué par"
                        value={truncateAddress(result.revocationInfo.revokedBy, 8)} mono />
                      <DetailRow label="Date de révocation"
                        value={formatTimestamp(result.revocationInfo.revokedAt)} />
                      <DetailRow label="Motif"
                        value={result.revocationInfo.reason || 'Non spécifié'} />
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Actions */}
            <div className="verify-actions">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Vérifier un autre certificat
              </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .verify-page {
          padding-top: calc(64px + var(--space-12));
          padding-bottom: var(--space-20);
        }

        .page-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 var(--space-8);
        }

        .page-header {
          text-align: center;
          margin-bottom: var(--space-10);
        }

        .page-eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: var(--space-4);
        }

        .eyebrow-line {
          width: 32px; height: 1px;
          background: var(--gold);
          opacity: 0.4;
        }

        .page-title {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 300;
          color: var(--white);
          margin-bottom: var(--space-4);
        }

        .page-subtitle {
          font-size: 15px;
          color: var(--white-40);
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* Search */
        .verify-search { margin-bottom: var(--space-8); }

        .verify-search__field {
          display: flex;
          gap: var(--space-4);
          align-items: flex-end;
        }

        .verify-search__field > *:first-child { flex: 1; }

        /* Loading */
        .verify-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-12);
        }

        .verify-loading__spinner {
          width: 24px; height: 24px;
          border: 2px solid var(--gold-dim);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin-slow 0.8s linear infinite;
        }

        .verify-loading__text {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--white-40);
          letter-spacing: 0.06em;
        }

        .verify-loading__dots {
          animation: pulse-dots 1.5s ease-in-out infinite;
        }

        @keyframes pulse-dots {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        /* Not found */
        .verify-notfound {
          text-align: center;
          padding: var(--space-8) 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .verify-notfound__icon {
          font-size: 36px;
          color: var(--error);
          opacity: 0.7;
        }

        .verify-notfound h3 {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--white);
        }

        .verify-notfound p {
          font-size: 14px;
          color: var(--white-40);
        }

        /* Banner */
        .verify-banner {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-6);
          border: 1px solid;
        }

        .verify-banner--valid {
          background: var(--success-dim);
          border-color: rgba(45,212,160,0.3);
        }

        .verify-banner--invalid {
          background: var(--error-dim);
          border-color: rgba(255,77,109,0.3);
        }

        .verify-banner__icon {
          font-size: 28px;
          font-weight: 300;
          width: 48px; height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .verify-banner--valid .verify-banner__icon {
          color: var(--success);
          background: rgba(45,212,160,0.1);
          border: 1px solid rgba(45,212,160,0.3);
        }

        .verify-banner--invalid .verify-banner__icon {
          color: var(--error);
          background: rgba(255,77,109,0.1);
          border: 1px solid rgba(255,77,109,0.3);
        }

        .verify-banner__title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 500;
          color: var(--white);
          margin-bottom: 4px;
        }

        .verify-banner__subtitle {
          font-size: 13px;
          color: var(--white-40);
        }

        .verify-banner__content { flex: 1; }

        /* Grid */
        .verify-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        /* Detail sections */
        .detail-section__title {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: var(--space-5);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-section__icon { opacity: 0.7; }

        .detail-rows {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .verify-actions {
          display: flex;
          justify-content: center;
          margin-top: var(--space-6);
        }

        @media (max-width: 640px) {
          .verify-search__field { flex-direction: column; align-items: stretch; }
          .verify-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

// ─── DetailRow helper ─────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--white-40)', flexShrink: 0 }}>{label}</span>
      {typeof value === 'string' ? (
        <span style={{
          fontSize: '13px',
          color: 'var(--white-70)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          textAlign: 'right',
          wordBreak: 'break-all',
        }}>
          {value}
        </span>
      ) : value}
    </div>
  );
}