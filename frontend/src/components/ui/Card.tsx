import React from 'react';

interface CardProps {
  children:    React.ReactNode;
  variant?:    'default' | 'gold' | 'success' | 'error' | 'elevated';
  className?:  string;
  onClick?:    () => void;
  animate?:    boolean;
  delay?:      number;
}

export function Card({
  children,
  variant   = 'default',
  className = '',
  onClick,
  animate   = false,
  delay     = 0,
}: CardProps) {
  return (
    <div
      className={`card card--${variant} ${animate ? 'animate-fade-in' : ''} ${onClick ? 'card--clickable' : ''} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
      <style>{`
        .card {
          background: var(--bg-glass);
          border: var(--border-glass);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
          transition: all var(--duration-normal) var(--ease-smooth);
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .card--clickable {
          cursor: pointer;
        }
        .card--clickable:hover {
          background: var(--bg-glass-hover);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }

        .card--gold {
          border: var(--border-gold);
          background: linear-gradient(135deg, rgba(201,168,76,0.05) 0%, var(--bg-glass) 100%);
          box-shadow: var(--shadow-gold);
        }
        .card--gold::before {
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent);
        }

        .card--success {
          border-color: rgba(45,212,160,0.3);
          background: linear-gradient(135deg, rgba(45,212,160,0.05) 0%, var(--bg-glass) 100%);
        }
        .card--success::before {
          background: linear-gradient(90deg, transparent, rgba(45,212,160,0.2), transparent);
        }

        .card--error {
          border-color: rgba(255,77,109,0.3);
          background: linear-gradient(135deg, rgba(255,77,109,0.05) 0%, var(--bg-glass) 100%);
        }
        .card--error::before {
          background: linear-gradient(90deg, transparent, rgba(255,77,109,0.2), transparent);
        }

        .card--elevated {
          background: var(--bg-elevated);
          border: var(--border-subtle);
          box-shadow: var(--shadow-elevated);
        }
      `}</style>
    </div>
  );
}