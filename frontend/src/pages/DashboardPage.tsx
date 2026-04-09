import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useWallet } from '../context/WalletContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { truncateAddress, formatTimestamp, formatHash, getCertVerifyUrl } from '../utils/crypto';
import type { PageId } from '../types';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { wallet, connect } = useWallet();
  const { certs, loading, error, reload } = useDashboard();

  const validCount   = certs.filter(c => !c.revoked).length;
  const revokedCount = certs.filter(c => c.revoked).length;

  if (wallet.status !== 'connected') {
    return (
      <div className="dashboard-page">
        <div className="page-container">
          <Card variant="gold" animate className="wallet-gate-card">
            <div className="wallet-gate">
              <span className="wallet-gate__icon">◈</span>
              <h3>Connexion requise</h3>
              <p>Le tableau de bord affiche les certificats émis par votre établissement.</p>
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

  return (
    <div className="dashboard-page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header animate-fade-in">
          <div className="page-eyebrow">
            <span className="eyebrow-line" />
            Établissement accrédité
            <span className="eyebrow-line" />
          </div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle mono">{wallet.address}</p>
        </div>

        {/* Stats */}
        <div className="dashboard-stats animate-fade-in delay-100">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-card__value">{certs.length}</div>
              <div className="stat-card__label">Total émis</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-card__value valid">{validCount}</div>
              <div className="stat-card__label">Valides</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-card__value revoked">{revokedCount}</div>
              <div className="stat-card__label">Révoqués</div>
            </div>
          </Card>
          <Card variant="gold">
            <div className="stat-card stat-card--action">
              <Button variant="gold" size="sm" onClick={() => onNavigate('issue')}>
                + Nouveau certificat
              </Button>
              <Button variant="ghost" size="sm" onClick={reload}>
                ↻ Actualiser
              </Button>
            </div>
          </Card>
        </div>

        {/* Loading */}
        {loading && (
          <div className="dashboard-loading animate-fade-in">
            <div className="loading-spinner" />
            <span>Chargement depuis la blockchain...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card variant="error" animate>
            <div className="dashboard-error">
              <span>⚠</span>
              <p>{error}</p>
              <Button variant="ghost" size="sm" onClick={reload}>Réessayer</Button>
            </div>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && certs.length === 0 && (
          <Card animate className="dashboard-empty">
            <div className="empty-state">
              <span className="empty-state__icon">◎</span>
              <h3>Aucun certificat émis</h3>
              <p>Vous n'avez pas encore émis de certificat depuis ce compte.</p>
              <Button variant="gold" size="md" onClick={() => onNavigate('issue')}>
                Émettre votre premier certificat
              </Button>
            </div>
          </Card>
        )}

        {/* Certificates list */}
        {!loading && certs.length > 0 && (
          <div className="dashboard-list animate-fade-in delay-200">
            <div className="list-header">
              <h2 className="list-title">Certificats émis</h2>
              <span className="list-count">{certs.length} certificat{certs.length > 1 ? 's' : ''}</span>
            </div>

            <div className="cert-list">
              {certs.map((cert, i) => (
                <CertRow
                  key={cert.certId}
                  cert={cert}
                  index={i}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{STYLES}</style>
    </div>
  );
}

// ─── CertRow ─────────────────────────────────────────────────────────────────

function CertRow({ cert, index, onNavigate }: {
  cert: any;
  index: number;
  onNavigate: (page: PageId) => void;
}) {
  const verifyUrl = getCertVerifyUrl(cert.certId);

  return (
    <div className={`cert-row animate-fade-in`} style={{ animationDelay: `${index * 50}ms` }}>
      <div className="cert-row__status">
        <Badge variant={cert.revoked ? 'revoked' : 'valid'} />
      </div>

      <div className="cert-row__info">
        <div className="cert-row__id mono">{formatHash(cert.certId, 10)}</div>
        <div className="cert-row__date">{formatTimestamp(cert.issuedAt)}</div>
      </div>

      <div className="cert-row__hash">
        <span className="cert-row__label">Hash</span>
        <span className="cert-row__value mono">{formatHash(cert.certHash, 8)}</span>
      </div>

      <div className="cert-row__nft">
        <span className="cert-row__label">NFT</span>
        <span className="cert-row__value mono">
          {cert.nftTokenId > 0n ? `#${cert.nftTokenId}` : '—'}
        </span>
      </div>

      <div className="cert-row__actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(verifyUrl);
          }}
        >
          Copier URL
        </Button>
        {!cert.revoked && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onNavigate('revoke')}
          >
            Révoquer
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .dashboard-page {
    padding-top: calc(64px + var(--space-12));
    padding-bottom: var(--space-20);
  }

  .page-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 var(--space-8);
  }

  .page-header { text-align: center; margin-bottom: var(--space-10); }

  .page-eyebrow {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--gold); margin-bottom: var(--space-4);
  }

  .eyebrow-line { width: 32px; height: 1px; background: var(--gold); opacity: 0.4; }

  .page-title {
    font-size: clamp(28px, 4vw, 44px); font-weight: 300;
    color: var(--white); margin-bottom: var(--space-3);
  }

  .page-subtitle {
    font-family: var(--font-mono); font-size: 12px;
    color: var(--white-40); word-break: break-all;
  }

  /* Wallet gate */
  .wallet-gate-card { max-width: 480px; margin: 80px auto 0; }
  .wallet-gate {
    text-align: center; padding: var(--space-8) 0;
    display: flex; flex-direction: column;
    align-items: center; gap: var(--space-4);
  }
  .wallet-gate__icon { font-size: 40px; color: var(--gold); }
  .wallet-gate h3 {
    font-family: var(--font-display); font-size: 22px; color: var(--white);
  }
  .wallet-gate p { font-size: 14px; color: var(--white-40); }

  /* Stats */
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  .stat-card {
    text-align: center;
    padding: var(--space-2) 0;
  }

  .stat-card__value {
    font-family: var(--font-display);
    font-size: 42px; font-weight: 300;
    color: var(--gold); line-height: 1;
    margin-bottom: var(--space-2);
  }

  .stat-card__value.valid  { color: var(--success); }
  .stat-card__value.revoked { color: var(--error); }

  .stat-card__label {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--white-40);
  }

  .stat-card--action {
    display: flex; flex-direction: column;
    gap: var(--space-3); align-items: center;
    justify-content: center; min-height: 80px;
  }

  /* Loading */
  .dashboard-loading {
    display: flex; align-items: center; justify-content: center;
    gap: var(--space-4); padding: var(--space-12);
    font-family: var(--font-mono); font-size: 13px; color: var(--white-40);
  }

  .loading-spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--gold-dim);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin-slow 0.8s linear infinite;
  }

  /* Error */
  .dashboard-error {
    display: flex; align-items: center; gap: var(--space-4);
    font-size: 14px; color: var(--white-40);
  }
  .dashboard-error span { font-size: 20px; color: var(--error); }

  /* Empty */
  .dashboard-empty { }
  .empty-state {
    text-align: center; padding: var(--space-10) 0;
    display: flex; flex-direction: column;
    align-items: center; gap: var(--space-4);
  }
  .empty-state__icon { font-size: 40px; color: var(--white-20); }
  .empty-state h3 {
    font-family: var(--font-display); font-size: 22px; color: var(--white);
  }
  .empty-state p { font-size: 14px; color: var(--white-40); }

  /* List */
  .dashboard-list { }

  .list-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: var(--border-subtle);
  }

  .list-title {
    font-family: var(--font-display); font-size: 20px;
    font-weight: 400; color: var(--white);
  }

  .list-count {
    font-family: var(--font-mono); font-size: 12px; color: var(--white-40);
  }

  .cert-list {
    display: flex; flex-direction: column; gap: var(--space-2);
  }

  /* Cert row */
  .cert-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-4) var(--space-5);
    background: var(--bg-glass);
    border: var(--border-subtle);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast);
  }

  .cert-row:hover {
    background: var(--bg-glass-hover);
    border-color: rgba(255,255,255,0.08);
  }

  .cert-row__info { min-width: 0; }

  .cert-row__id {
    font-family: var(--font-mono); font-size: 13px;
    color: var(--white-70); margin-bottom: 4px;
  }

  .cert-row__date {
    font-size: 12px; color: var(--white-40);
  }

  .cert-row__hash,
  .cert-row__nft {
    display: flex; flex-direction: column;
    gap: 4px; text-align: right;
  }

  .cert-row__label {
    font-family: var(--font-mono); font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--white-40);
  }

  .cert-row__value {
    font-family: var(--font-mono); font-size: 12px;
    color: var(--white-70);
  }

  .cert-row__actions {
    display: flex; gap: var(--space-2);
  }

  .mono { font-family: var(--font-mono); }

  @media (max-width: 768px) {
    .dashboard-stats { grid-template-columns: repeat(2, 1fr); }
    .cert-row { grid-template-columns: auto 1fr auto; }
    .cert-row__hash, .cert-row__nft { display: none; }
  }
`;