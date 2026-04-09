import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  hint?:     string;
  error?:    string;
  icon?:     React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`field__wrapper ${error ? 'field__wrapper--error' : ''}`}>
        {icon && <span className="field__icon">{icon}</span>}
        <input
          id={inputId}
          className={`field__input ${icon ? 'field__input--icon' : ''}`}
          {...props}
        />
      </div>
      {error  && <span className="field__error">{error}</span>}
      {hint && !error && <span className="field__hint">{hint}</span>}

      <style>{`
        .field { display: flex; flex-direction: column; gap: 6px; }

        .field__label {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--white-40);
        }

        .field__wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field__icon {
          position: absolute;
          left: 14px;
          color: var(--white-40);
          display: flex;
          align-items: center;
          pointer-events: none;
          font-size: 14px;
        }

        .field__input {
          width: 100%;
          background: var(--bg-glass);
          border: var(--border-glass);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--white);
          outline: none;
          transition: all var(--duration-normal) var(--ease-smooth);
        }

        .field__input--icon { padding-left: 42px; }

        .field__input::placeholder { color: var(--white-20); }

        .field__input:focus {
          border-color: rgba(201,168,76,0.4);
          background: rgba(201,168,76,0.03);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.08), 0 0 20px rgba(201,168,76,0.05);
        }

        .field__wrapper--error .field__input {
          border-color: rgba(255,77,109,0.4);
        }
        .field__wrapper--error .field__input:focus {
          box-shadow: 0 0 0 3px rgba(255,77,109,0.08);
        }

        .field__error {
          font-size: 12px;
          color: var(--error);
          font-family: var(--font-mono);
        }

        .field__hint {
          font-size: 12px;
          color: var(--white-40);
        }
      `}</style>
    </div>
  );
}