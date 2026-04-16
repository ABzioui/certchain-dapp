import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { truncateAddress } from '../../utils/crypto';
import { Button } from '../ui/Button';
import type { PageId } from '../../types';

interface NavbarProps {
  currentPage: PageId;
  onNavigate:  (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'home',      label: 'Accueil'       },
  { id: 'verify',    label: 'Vérifier'      },
  { id: 'issue',     label: 'Émettre'       },
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'did',       label: 'Mon DID'       },
];

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { wallet, connect, disconnect } = useWallet();

  return (
    <nav className="navbar">
      {/* Logo */}
      <button className="navbar__logo" onClick={() => onNavigate('home')}>
        <span className="navbar__logo-mark">⬡</span>
        <span className="navbar__logo-text">Cert<em>Chain</em></span>
      </button>

      {/* Nav Links */}
      <ul className="navbar__links">
        {NAV_ITEMS.map(item => (
          <li key={item.id}>
            <button
              className={`navbar__link ${currentPage === item.id ? 'navbar__link--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Wallet */}
      <div className="navbar__wallet">
        {wallet.status === 'connected' && wallet.address ? (
          <div className="navbar__wallet-info">
            {!wallet.isCorrectNetwork && (
              <span className="navbar__network-warn">⚠ Mauvais réseau</span>
            )}
            <button className="navbar__address" onClick={disconnect} title="Déconnecter">
              <span className="navbar__address-dot" />
              {truncateAddress(wallet.address)}
            </button>
          </div>
        ) : (
          <Button
            variant="gold"
            size="sm"
            loading={wallet.status === 'connecting'}
            onClick={connect}
          >
            Connecter Wallet
          </Button>
        )}
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-8);
          height: 64px;
          background: rgba(8,10,15,0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: var(--border-subtle);
        }

        .navbar::after {
          content: '';
          position: absolute;
          bottom: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
        }

        .navbar__logo {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer;
          color: var(--white); padding: 0; flex-shrink: 0;
        }

        .navbar__logo-mark { font-size: 20px; color: var(--gold); line-height: 1; }

        .navbar__logo-text {
          font-family: var(--font-display); font-size: 22px;
          font-weight: 500; letter-spacing: 0.02em; color: var(--white);
        }

        .navbar__logo-text em { font-style: italic; color: var(--gold); }

        .navbar__links {
          display: flex; align-items: center;
          gap: var(--space-1); list-style: none;
        }

        .navbar__link {
          background: none; border: none; cursor: pointer;
          padding: 6px 12px;
          font-family: var(--font-body); font-size: 13px;
          font-weight: 400; letter-spacing: 0.04em;
          color: var(--white-40); border-radius: var(--radius-sm);
          transition: all var(--duration-fast);
          position: relative; white-space: nowrap;
        }

        .navbar__link:hover {
          color: var(--white-70); background: var(--white-05);
        }

        .navbar__link--active { color: var(--gold); }

        .navbar__link--active::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 12px; right: 12px;
          height: 1px; background: var(--gold); border-radius: 1px;
        }

        .navbar__wallet-info {
          display: flex; align-items: center; gap: var(--space-3);
        }

        .navbar__network-warn {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--warning); padding: 4px 8px;
          background: var(--warning-dim); border-radius: var(--radius-sm);
        }

        .navbar__address {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-glass); border: var(--border-glass);
          border-radius: var(--radius-md); padding: 6px 14px;
          font-family: var(--font-mono); font-size: 12px;
          color: var(--white-70); cursor: pointer;
          transition: all var(--duration-fast);
        }

        .navbar__address:hover {
          border-color: rgba(255,77,109,0.3); color: var(--error);
        }

        .navbar__address-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--success);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }

        @media (max-width: 900px) {
          .navbar__links { display: none; }
          .navbar { padding: 0 var(--space-4); }
        }
      `}</style>
    </nav>
  );
}