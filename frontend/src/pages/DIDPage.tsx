import React, { useState, useEffect } from "react";
import { useDID } from "../hooks/useDID";
import { useWallet } from "../context/WalletContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { formatTimestamp, truncateAddress } from "../utils/crypto";

export function DIDPage() {
  const { wallet, connect }  = useWallet();
  const {
    didDoc, didUri, loadStatus,
    saveStatus, deactStatus, error,
    saveDID, deactivateDID, resetSave, resetDeact,
  } = useDID();

  const [name,        setName]        = useState("");
  const [ipfsDocHash, setIpfsDocHash] = useState("");
  const [showDeact,   setShowDeact]   = useState(false);
  const [deactConfirm, setDeactConfirm] = useState(false);

  // Pré-remplir le formulaire si DID existe déjà
  useEffect(() => {
    if (didDoc) {
      setName(didDoc.name);
      setIpfsDocHash(didDoc.ipfsDocHash);
    }
  }, [didDoc]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      resetSave();
      saveDID(name.trim(), ipfsDocHash.trim());
    }
  };

  const handleDeactivate = async () => {
    await deactivateDID();
    setShowDeact(false);
    setDeactConfirm(false);
  };

  const isNew     = loadStatus === "not_found";
  const hasActive = didDoc?.active === true;
  const isSaving  = ["pending", "mining"].includes(saveStatus);
  const isDeacting = ["pending", "mining"].includes(deactStatus);

  // ─── Guard wallet ─────────────────────────────────────────────────────────
  if (wallet.status !== "connected") {
    return (
      <div className="did-page">
        <div className="page-container">
          <Card variant="gold" animate className="wallet-gate-card">
            <div className="wallet-gate">
              <span className="wallet-gate__icon">⬡</span>
              <h3>Connexion requise</h3>
              <p>La gestion DID est réservée aux établissements connectés.</p>
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
    <div className="did-page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header animate-fade-in">
          <div className="page-eyebrow">
            <span className="eyebrow-line" />
            Identité décentralisée
            <span className="eyebrow-line" />
          </div>
          <h1 className="page-title">Gestion DID</h1>
          <p className="page-subtitle">
            Votre DID (Decentralized Identifier) est votre identité on-chain.
            Elle prouve qui vous êtes en tant qu'établissement émetteur,
            de façon permanente et vérifiable par tous.
          </p>
        </div>

        {/* DID URI card */}
        <Card variant="gold" animate delay={100} className="did-uri-card">
          <div className="did-uri">
            <div className="did-uri__left">
              <span className="did-uri__label">Votre DID</span>
              <span className="did-uri__value mono">
                {didUri ?? `did:ethr:${wallet.address}`}
              </span>
            </div>
            <div className="did-uri__right">
              {loadStatus === "loading" ? (
                <div className="did-spinner" />
              ) : loadStatus === "found" && didDoc ? (
                <Badge
                  variant={hasActive ? "gold" : "revoked"}
                  label={hasActive ? "ACTIF" : "DÉSACTIVÉ"}
                  pulse={hasActive}
                />
              ) : (
                <Badge variant="unknown" label="NON ENREGISTRÉ" />
              )}
            </div>
          </div>
          <div className="did-addr">
            <span className="did-addr__label">Adresse Ethereum</span>
            <span className="did-addr__value mono">{wallet.address}</span>
          </div>
        </Card>

        {/* Infos DID existant */}
        {loadStatus === "found" && didDoc && (
          <Card variant="elevated" animate delay={200}>
            <div className="did-info">
              <h3 className="did-info__title">
                <span>◈</span> Identité enregistrée
              </h3>
              <div className="did-info__rows">
                <InfoRow label="Nom de l'établissement" value={didDoc.name} />
                <InfoRow label="Document IPFS"
                  value={didDoc.ipfsDocHash || "—"} mono />
                <InfoRow label="Enregistré le"
                  value={formatTimestamp(didDoc.registeredAt)} />
                <InfoRow label="Dernière mise à jour"
                  value={formatTimestamp(didDoc.updatedAt)} />
                <InfoRow label="Statut" value={
                  <Badge
                    variant={didDoc.active ? "gold" : "revoked"}
                    label={didDoc.active ? "ACTIF" : "DÉSACTIVÉ"}
                  />
                } />
              </div>
            </div>
          </Card>
        )}

        {/* Formulaire enregistrement / mise à jour */}
        {(isNew || hasActive) && (
          <Card variant="elevated" animate delay={300}>
            <form onSubmit={handleSave}>
              <div className="did-form">
                <h3 className="did-form__title">
                  <span>⬡</span>
                  {isNew ? "Enregistrer votre DID" : "Mettre à jour votre DID"}
                </h3>

                <div className="did-form__fields">
                  <Input
                    label="Nom de l'établissement"
                    value={name}
                    onChange={e => { setName(e.target.value); resetSave(); }}
                    placeholder="Université Paris-Saclay"
                    hint="Nom lisible affiché lors de la vérification d'un certificat"
                    required
                  />
                  <Input
                    label="Hash IPFS du document DID (optionnel)"
                    value={ipfsDocHash}
                    onChange={e => { setIpfsDocHash(e.target.value); resetSave(); }}
                    placeholder="QmXyz..."
                    hint="Hash IPFS du document DID complet au format JSON-LD (optionnel)"
                  />
                </div>

                {saveStatus === "success" && (
                  <div className="did-form__success">
                    ✓ DID {isNew ? "enregistré" : "mis à jour"} avec succès sur la blockchain.
                  </div>
                )}

                {saveStatus === "error" && error && (
                  <div className="did-form__error">⚠ {error}</div>
                )}

                <div className="did-form__actions">
                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    loading={isSaving}
                  >
                    {saveStatus === "pending" ? "En attente de signature..."
                      : saveStatus === "mining" ? "Enregistrement en cours..."
                      : isNew ? "Enregistrer le DID" : "Mettre à jour le DID"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        )}

        {/* Zone de désactivation */}
        {hasActive && (
          <Card variant="error" animate delay={400}>
            <div className="did-deact">
              <div className="did-deact__header">
                <div>
                  <h3 className="did-deact__title">Zone de danger</h3>
                  <p className="did-deact__desc">
                    La désactivation est <strong>irréversible</strong>.
                    Votre DID restera visible on-chain mais marqué comme inactif.
                    Les certificats émis resteront valides.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeact(!showDeact)}
                >
                  {showDeact ? "Annuler" : "Désactiver le DID"}
                </Button>
              </div>

              {showDeact && (
                <div className="did-deact__confirm">
                  <label className="confirm-checkbox">
                    <input
                      type="checkbox"
                      checked={deactConfirm}
                      onChange={e => setDeactConfirm(e.target.checked)}
                    />
                    <span>
                      Je confirme vouloir désactiver définitivement le DID associé à{" "}
                      <strong>{truncateAddress(wallet.address ?? "", 6)}</strong>.
                    </span>
                  </label>

                  {deactStatus === "error" && error && (
                    <div className="did-form__error">⚠ {error}</div>
                  )}

                  <Button
                    variant="danger"
                    size="md"
                    disabled={!deactConfirm}
                    loading={isDeacting}
                    onClick={handleDeactivate}
                  >
                    {deactStatus === "pending" ? "En attente de signature..."
                      : deactStatus === "mining" ? "Désactivation en cours..."
                      : "Confirmer la désactivation"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Explication DID */}
        <Card animate delay={500}>
          <div className="did-explain">
            <h3 className="did-explain__title">Qu'est-ce qu'un DID ?</h3>
            <div className="did-explain__content">
              <div className="did-explain__item">
                <span className="did-explain__icon">◈</span>
                <div>
                  <strong>Auto-souverain</strong>
                  <p>Votre identité ne dépend d'aucune autorité centrale. Elle est ancrée dans la blockchain Ethereum.</p>
                </div>
              </div>
              <div className="did-explain__item">
                <span className="did-explain__icon">⬡</span>
                <div>
                  <strong>Permanent</strong>
                  <p>Même si votre établissement ferme, votre DID reste résolvable. Les recruteurs peuvent toujours vérifier qui a émis un diplôme.</p>
                </div>
              </div>
              <div className="did-explain__item">
                <span className="did-explain__icon">◉</span>
                <div>
                  <strong>Format standard</strong>
                  <p>Format <code>did:ethr:0x...</code> — standard W3C DID compatible avec tous les systèmes d'identité décentralisée.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>
      <style>{STYLES}</style>
    </div>
  );
}

// ─── Helper InfoRow ───────────────────────────────────────────────────────────
function InfoRow({ label, value, mono = false }: {
  label: string; value: React.ReactNode; mono?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: "8px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"
    }}>
      <span style={{ fontSize: "12px", color: "var(--white-40)", flexShrink: 0 }}>{label}</span>
      {typeof value === "string" ? (
        <span style={{
          fontSize: "13px", color: "var(--white-70)", textAlign: "right",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
          wordBreak: "break-all",
        }}>{value}</span>
      ) : value}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  .did-page { padding-top: calc(64px + var(--space-12)); padding-bottom: var(--space-20); }

  .page-container {
    max-width: 720px; margin: 0 auto; padding: 0 var(--space-8);
    display: flex; flex-direction: column; gap: var(--space-5);
  }

  .page-header { text-align: center; margin-bottom: var(--space-2); }

  .page-eyebrow {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--gold); margin-bottom: var(--space-4);
  }

  .eyebrow-line { width: 32px; height: 1px; background: var(--gold); opacity: 0.4; }

  .page-title {
    font-size: clamp(28px, 4vw, 44px); font-weight: 300;
    color: var(--white); margin-bottom: var(--space-4);
  }

  .page-subtitle {
    font-size: 15px; color: var(--white-40);
    max-width: 560px; margin: 0 auto; line-height: 1.7;
  }

  /* Wallet gate */
  .wallet-gate-card { max-width: 480px; margin: 80px auto 0; }
  .wallet-gate {
    text-align: center; padding: var(--space-8) 0;
    display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
  }
  .wallet-gate__icon { font-size: 40px; color: var(--gold); }
  .wallet-gate h3 { font-family: var(--font-display); font-size: 22px; color: var(--white); }
  .wallet-gate p { font-size: 14px; color: var(--white-40); }

  /* DID URI */
  .did-uri {
    display: flex; justify-content: space-between; align-items: center;
    gap: var(--space-4); margin-bottom: var(--space-4);
  }

  .did-uri__left { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

  .did-uri__label {
    font-family: var(--font-mono); font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.12em; color: var(--gold);
  }

  .did-uri__value {
    font-family: var(--font-mono); font-size: 13px;
    color: var(--white-70); word-break: break-all;
  }

  .did-addr {
    display: flex; gap: var(--space-3); align-items: center;
    padding-top: var(--space-3); border-top: var(--border-subtle);
    font-size: 12px;
  }

  .did-addr__label { color: var(--white-40); flex-shrink: 0; }
  .did-addr__value { font-family: var(--font-mono); color: var(--white-40); word-break: break-all; }

  .did-spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--gold-dim); border-top-color: var(--gold);
    border-radius: 50%; animation: spin-slow 0.8s linear infinite;
  }

  /* DID Info */
  .did-info__title {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--gold); margin-bottom: var(--space-4);
    display: flex; align-items: center; gap: 8px;
  }

  .did-info__rows { display: flex; flex-direction: column; }

  /* DID Form */
  .did-form__title {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--gold); margin-bottom: var(--space-5);
    display: flex; align-items: center; gap: 8px;
  }

  .did-form__fields { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-5); }

  .did-form__success {
    font-size: 13px; color: var(--success);
    padding: var(--space-3) var(--space-4);
    background: var(--success-dim); border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
  }

  .did-form__error {
    font-size: 13px; color: var(--error);
    padding: var(--space-3) var(--space-4);
    background: var(--error-dim); border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
  }

  .did-form__actions { display: flex; justify-content: flex-start; }

  /* Deactivation */
  .did-deact__header {
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: var(--space-6);
  }

  .did-deact__title {
    font-family: var(--font-mono); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--error); margin-bottom: var(--space-2);
  }

  .did-deact__desc {
    font-size: 13px; color: var(--white-40); line-height: 1.6; margin: 0;
  }

  .did-deact__desc strong { color: var(--error); }

  .did-deact__confirm {
    margin-top: var(--space-5); padding-top: var(--space-5);
    border-top: 1px solid rgba(255,77,109,0.2);
    display: flex; flex-direction: column; gap: var(--space-4);
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

  /* Explication */
  .did-explain__title {
    font-family: var(--font-display); font-size: 18px;
    color: var(--white); margin-bottom: var(--space-5);
  }

  .did-explain__content { display: flex; flex-direction: column; gap: var(--space-5); }

  .did-explain__item { display: flex; gap: var(--space-4); align-items: flex-start; }

  .did-explain__icon { font-size: 18px; color: var(--gold); flex-shrink: 0; margin-top: 2px; }

  .did-explain__item strong { display: block; color: var(--white); font-size: 14px; margin-bottom: 4px; }

  .did-explain__item p { font-size: 13px; color: var(--white-40); margin: 0; line-height: 1.6; }

  .did-explain__item code {
    font-family: var(--font-mono); font-size: 12px;
    background: var(--bg-glass); padding: 1px 6px;
    border-radius: 3px; color: var(--gold);
  }

  .mono { font-family: var(--font-mono); }
`;