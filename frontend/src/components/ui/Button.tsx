import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'ghost' | 'danger' | 'cyan';
  size?:    'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?:    React.ReactNode;
}

export function Button({
  variant = 'gold',
  size    = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="btn__icon">{icon}</span>
      ) : null}
      <span className="btn__label">{children}</span>
      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-body);
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all var(--duration-normal) var(--ease-smooth);
          white-space: nowrap;
        }

        .btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity var(--duration-fast);
        }

        .btn:hover::before { opacity: 1; }

        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Sizes */
        .btn--sm { padding: 8px 20px; font-size: 11px; border-radius: var(--radius-sm); }
        .btn--md { padding: 12px 28px; font-size: 12px; border-radius: var(--radius-md); }
        .btn--lg { padding: 16px 40px; font-size: 13px; border-radius: var(--radius-md); }

        /* Gold variant */
        .btn--gold {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
          background-size: 200% 100%;
          color: var(--bg-deep);
          box-shadow: 0 4px 20px var(--gold-glow);
        }
        .btn--gold:hover {
          background-position: right center;
          box-shadow: 0 6px 30px var(--gold-glow), 0 0 60px rgba(201,168,76,0.2);
          transform: translateY(-1px);
        }
        .btn--gold:active { transform: translateY(0); }

        /* Ghost variant */
        .btn--ghost {
          background: transparent;
          color: var(--white-70);
          border: var(--border-glass);
        }
        .btn--ghost:hover {
          border-color: rgba(240,237,230,0.2);
          color: var(--white);
          background: var(--bg-glass-hover);
        }

        /* Cyan variant */
        .btn--cyan {
          background: transparent;
          color: var(--cyan);
          border: 1px solid var(--cyan);
          box-shadow: 0 0 20px var(--cyan-dim);
        }
        .btn--cyan:hover {
          background: var(--cyan-dim);
          box-shadow: 0 0 40px var(--cyan-glow);
        }

        /* Danger variant */
        .btn--danger {
          background: transparent;
          color: var(--error);
          border: 1px solid var(--error);
        }
        .btn--danger:hover {
          background: var(--error-dim);
          box-shadow: 0 0 20px rgba(255,77,109,0.2);
        }

        /* Spinner */
        .btn__spinner {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin-slow 0.7s linear infinite;
          flex-shrink: 0;
        }

        .btn__icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          font-size: 1.1em;
        }
      `}</style>
    </button>
  );
}