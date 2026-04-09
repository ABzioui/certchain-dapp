import React from 'react';

type BadgeVariant = 'valid' | 'revoked' | 'pending' | 'unknown' | 'gold';

interface BadgeProps {
  variant:  BadgeVariant;
  label?:   string;
  pulse?:   boolean;
}

const BADGE_CONFIG: Record<BadgeVariant, { color: string; bg: string; border: string; default: string }> = {
  valid:   { color: 'var(--success)',  bg: 'var(--success-dim)',  border: 'rgba(45,212,160,0.3)',  default: 'VALIDE' },
  revoked: { color: 'var(--error)',    bg: 'var(--error-dim)',    border: 'rgba(255,77,109,0.3)',   default: 'RÉVOQUÉ' },
  pending: { color: 'var(--warning)',  bg: 'var(--warning-dim)',  border: 'rgba(255,184,48,0.3)',   default: 'EN ATTENTE' },
  unknown: { color: 'var(--white-40)', bg: 'var(--white-05)',     border: 'rgba(240,237,230,0.1)',  default: 'INCONNU' },
  gold:    { color: 'var(--gold)',     bg: 'var(--gold-dim)',     border: 'rgba(201,168,76,0.3)',   default: 'ACCRÉDITÉ' },
};

export function Badge({ variant, label, pulse = false }: BadgeProps) {
  const config = BADGE_CONFIG[variant];

  return (
    <span className={`badge ${pulse ? 'badge--pulse' : ''}`}>
      <span className="badge__dot" />
      <span className="badge__label">{label ?? config.default}</span>
      <style>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          background: ${config.bg};
          border: 1px solid ${config.border};
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${config.color};
          white-space: nowrap;
        }

        .badge__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${config.color};
          flex-shrink: 0;
        }

        .badge--pulse .badge__dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </span>
  );
}