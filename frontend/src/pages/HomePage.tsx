import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { PageId } from '../types';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

const FEATURES = [
  {
    icon: '◈',
    title: 'Immutabilité',
    desc: 'Chaque certificat est gravé sur la blockchain Ethereum. Aucune modification possible après émission.',
    delay: 100,
  },
  {
    icon: '⬡',
    title: 'Vérification Instantanée',
    desc: 'N\'importe quel recruteur peut vérifier l\'authenticité en secondes, sans intermédiaire.',
    delay: 200,
  },
  {
    icon: '◉',
    title: 'Badge NFT',
    desc: 'Chaque diplôme génère un token ERC-721 unique, propriété exclusive du diplômé.',
    delay: 300,
  },
  {
    icon: '⬕',
    title: 'Identité DID',
    desc: 'Les établissements émetteurs sont identifiés via des DIDs cryptographiques décentralisés.',
    delay: 400,
  },
];

const STATS = [
  { value: '0ms',  label: 'Délai de vérification' },
  { value: '100%', label: 'Résistant à la fraude' },
  { value: '∞',    label: 'Durée de vie' },
  { value: 'DID',  label: 'Identités souveraines' },
];

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="home">

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg-orb hero__bg-orb--1" />
        <div className="hero__bg-orb hero__bg-orb--2" />

        <div className="hero__content animate-fade-in">
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-line" />
            <span>Blockchain Ethereum · ERC-721 · DID</span>
            <span className="hero__eyebrow-line" />
          </div>

          <h1 className="hero__title">
            La preuve d'authenticité
            <br />
            <em>gravée dans la chaîne</em>
          </h1>

          <p className="hero__subtitle">
            CertChain transforme l'émission et la vérification de diplômes grâce
            à la blockchain. Immuable, instantané, décentralisé.
          </p>

          <div className="hero__actions">
            <Button variant="gold" size="lg" onClick={() => onNavigate('verify')}>
              Vérifier un certificat
            </Button>
            <Button variant="ghost" size="lg" onClick={() => onNavigate('issue')}>
              Émettre un diplôme
            </Button>
          </div>
        </div>

        {/* Animated cert preview */}
        <div className="hero__visual animate-fade-in delay-300">
          <div className="cert-preview">
            <div className="cert-preview__header">
              <span className="cert-preview__logo">⬡ CertChain</span>
              <span className="cert-preview__badge valid">● VALIDE</span>
            </div>
            <div className="cert-preview__title">Master en Informatique</div>
            <div className="cert-preview__name">Alice Martin</div>
            <div className="cert-preview__meta">
              <div className="cert-preview__meta-row">
                <span className="cert-preview__meta-label">Mention</span>
                <span className="cert-preview__meta-value">Très Bien</span>
              </div>
              <div className="cert-preview__meta-row">
                <span className="cert-preview__meta-label">Émetteur</span>
                <span className="cert-preview__meta-value mono">0xf39F...2266</span>
              </div>
              <div className="cert-preview__meta-row">
                <span className="cert-preview__meta-label">Hash</span>
                <span className="cert-preview__meta-value mono">0x4a2f...8e91</span>
              </div>
            </div>
            <div className="cert-preview__footer">
              <div className="cert-preview__qr">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="cert-preview__qr-cell"
                    style={{ background: Math.random() > 0.5 ? 'var(--gold)' : 'transparent' }} />
                ))}
              </div>
              <div className="cert-preview__nft">
                <div className="cert-preview__nft-label">NFT #0</div>
                <div className="cert-preview__nft-chain">ERC-721</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────────────── */}
      <section className="stats animate-fade-in delay-400">
        <div className="stats__grid">
          {STATS.map((stat, i) => (
            <div key={i} className="stat">
              <div className="stat__value">{stat.value}</div>
              <div className="stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────────── */}
      <section className="features">
        <div className="section-header">
          <h2 className="section-title">Pourquoi CertChain ?</h2>
          <p className="section-subtitle">
            Une architecture décentralisée pensée pour l'authenticité et la pérennité.
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <Card key={i} animate delay={f.delay}>
              <div className="feature">
                <div className="feature__icon">{f.icon}</div>
                <h3 className="feature__title">{f.title}</h3>
                <p className="feature__desc">{f.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section className="cta animate-fade-in">
        <Card variant="gold">
          <div className="cta__inner">
            <h2 className="cta__title">Prêt à certifier ?</h2>
            <p className="cta__desc">
              Connectez votre wallet MetaMask et commencez à émettre des certificats
              immuables sur la blockchain Ethereum.
            </p>
            <div className="cta__actions">
              <Button variant="gold" size="lg" onClick={() => onNavigate('issue')}>
                Commencer maintenant
              </Button>
              <Button variant="ghost" size="lg" onClick={() => onNavigate('verify')}>
                Voir une démo de vérification
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <style>{`
        .home {
          padding-top: 64px;
          max-width: 1200px;
          margin: 0 auto;
          padding-left: var(--space-8);
          padding-right: var(--space-8);
        }

        /* Hero */
        .hero {
          min-height: calc(100vh - 64px);
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: var(--space-16);
          padding: var(--space-20) 0;
          position: relative;
        }

        .hero__bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .hero__bg-orb--1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
          top: 10%; left: -10%;
        }
        .hero__bg-orb--2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%);
          bottom: 10%; right: 0;
        }

        .hero__eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: var(--space-6);
        }

        .hero__eyebrow-line {
          flex: 1;
          max-width: 40px;
          height: 1px;
          background: var(--gold);
          opacity: 0.4;
        }

        .hero__title {
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 300;
          color: var(--white);
          margin-bottom: var(--space-6);
          line-height: 1.1;
        }

        .hero__title em {
          color: var(--gold);
          font-style: italic;
        }

        .hero__subtitle {
          font-size: 16px;
          color: var(--white-70);
          line-height: 1.7;
          margin-bottom: var(--space-10);
          max-width: 480px;
        }

        .hero__actions {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        /* Cert Preview */
        .hero__visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .cert-preview {
          width: 320px;
          background: var(--bg-elevated);
          border: var(--border-gold);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-gold);
          animation: float 4s ease-in-out infinite;
        }

        .cert-preview__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .cert-preview__logo {
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--gold);
        }

        .cert-preview__badge {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          padding: 3px 8px;
          border-radius: 100px;
        }

        .cert-preview__badge.valid {
          color: var(--success);
          background: var(--success-dim);
          border: 1px solid rgba(45,212,160,0.3);
        }

        .cert-preview__title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--white);
          margin-bottom: var(--space-2);
        }

        .cert-preview__name {
          font-family: var(--font-display);
          font-size: 26px;
          font-style: italic;
          color: var(--gold);
          margin-bottom: var(--space-6);
        }

        .cert-preview__meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: var(--space-4);
          background: var(--bg-glass);
          border-radius: var(--radius-md);
          border: var(--border-subtle);
          margin-bottom: var(--space-4);
        }

        .cert-preview__meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .cert-preview__meta-label { color: var(--white-40); }
        .cert-preview__meta-value { color: var(--white-70); }
        .cert-preview__meta-value.mono { font-family: var(--font-mono); font-size: 11px; }

        .cert-preview__footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .cert-preview__qr {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
          width: 56px;
          height: 56px;
        }

        .cert-preview__qr-cell {
          border-radius: 1px;
        }

        .cert-preview__nft {
          text-align: right;
        }

        .cert-preview__nft-label {
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--gold);
          font-weight: 500;
        }

        .cert-preview__nft-chain {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--white-40);
          letter-spacing: 0.1em;
        }

        /* Stats */
        .stats {
          padding: var(--space-12) 0;
          border-top: var(--border-subtle);
          border-bottom: var(--border-subtle);
        }

        .stats__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-8);
        }

        .stat { text-align: center; }

        .stat__value {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 300;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat__label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--white-40);
        }

        /* Features */
        .features { padding: var(--space-20) 0; }

        .section-header {
          text-align: center;
          margin-bottom: var(--space-12);
        }

        .section-title {
          font-size: 36px;
          font-weight: 300;
          color: var(--white);
          margin-bottom: var(--space-4);
        }

        .section-subtitle {
          font-size: 15px;
          color: var(--white-40);
          max-width: 480px;
          margin: 0 auto;
        }

        .features__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
        }

        .feature { }

        .feature__icon {
          font-size: 24px;
          color: var(--gold);
          margin-bottom: var(--space-4);
          display: block;
        }

        .feature__title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 400;
          color: var(--white);
          margin-bottom: var(--space-3);
        }

        .feature__desc {
          font-size: 14px;
          color: var(--white-40);
          line-height: 1.7;
        }

        /* CTA */
        .cta { padding: var(--space-8) 0 var(--space-20); }

        .cta__inner {
          text-align: center;
          padding: var(--space-8) 0;
        }

        .cta__title {
          font-size: 36px;
          font-weight: 300;
          color: var(--white);
          margin-bottom: var(--space-4);
        }

        .cta__desc {
          font-size: 15px;
          color: var(--white-70);
          max-width: 520px;
          margin: 0 auto var(--space-8);
          line-height: 1.7;
        }

        .cta__actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
        }

        .mono { font-family: var(--font-mono); }

        /* Responsive */
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; text-align: center; }
          .hero__visual { display: none; }
          .hero__eyebrow { justify-content: center; }
          .hero__subtitle { margin: 0 auto var(--space-10); }
          .hero__actions { justify-content: center; }
          .stats__grid { grid-template-columns: repeat(2, 1fr); }
          .features__grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .stats__grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
          .stat__value { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}