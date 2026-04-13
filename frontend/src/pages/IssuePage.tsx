import React, { useState } from "react";
import { useIssue } from "../hooks/useIssue";
import { useWallet } from "../context/WalletContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { getCertVerifyUrl, formatHash } from "../utils/crypto";
import type { IssueCertFormData } from "../types";
import { QRCodeSVG } from "qrcode.react";

const EMPTY_FORM: IssueCertFormData = {
  recipientName: "",
  recipientAddr: "",
  diplomaTitle: "",
  mention: "",
  date: "",
  ipfsHash: "",
};

const MENTIONS = ["Très Bien", "Bien", "Assez Bien", "Passable", "—"];

export function IssuePage() {
  const { wallet, connect } = useWallet();
  const { issue, status, result, error, reset } = useIssue();

  const [form, setForm] = useState<IssueCertFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<IssueCertFormData>>({});

  const update =
    (field: keyof IssueCertFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const newErrors: Partial<IssueCertFormData> = {};

    if (!form.recipientName.trim()) newErrors.recipientName = "Nom requis";
    if (!form.diplomaTitle.trim()) newErrors.diplomaTitle = "Intitulé requis";
    if (!form.date) newErrors.date = "Date requise";

    if (form.recipientAddr && !/^0x[a-fA-F0-9]{40}$/.test(form.recipientAddr)) {
      newErrors.recipientAddr = "Adresse Ethereum invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) issue(form);
  };

  const handleReset = () => {
    reset();
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const generateCertifiedPdf = async (verifyUrl: string) => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const QRCode = (await import("qrcode")).default;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText("CERTIFICAT OFFICIEL", {
      x: 170,
      y: 780,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Nom : ${form.recipientName}`, {
      x: 60,
      y: 700,
      size: 18,
      font,
    });

    page.drawText(`Diplôme : ${form.diplomaTitle}`, {
      x: 60,
      y: 660,
      size: 18,
      font,
    });

    page.drawText(`Mention : ${form.mention || "-"}`, {
      x: 60,
      y: 620,
      size: 18,
      font,
    });

    page.drawText(`Date : ${form.date}`, {
      x: 60,
      y: 580,
      size: 18,
      font,
    });

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 1,
    });

    const qrBytes = await fetch(qrDataUrl).then((r) => r.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrBytes);

    page.drawText("Scanner pour vérifier", {
      x: 350,
      y: 320,
      size: 14,
      font: boldFont,
    });

    page.drawImage(qrImage, {
      x: 340,
      y: 80,
      width: 180,
      height: 180,
    });

    const pdfBytes = await pdfDoc.save();

    const pdfArrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength,
    );

    // force un vrai ArrayBuffer propre
    const safeBytes = new Uint8Array(pdfBytes);

    const blob = new Blob([safeBytes.buffer], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `certificat-${form.recipientName}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  };

  if (status === "success" && result) {
    const verifyUrl = getCertVerifyUrl(result.certId);

    return (
      <div className="issue-page">
        <div className="page-container">
          <div className="issue-success animate-fade-in-scale">
            <div className="issue-success__icon">✓</div>
            <h2 className="issue-success__title">
              Certificat émis avec succès
            </h2>
            <p className="issue-success__subtitle">
              Le certificat a été enregistré de façon permanente sur la
              blockchain Ethereum.
            </p>

            <div className="issue-success__details">
              <Card variant="gold">
                <div className="success-detail">
                  <div className="success-detail__row">
                    <span className="success-detail__label">Cert ID</span>
                    <span className="success-detail__value mono">
                      {formatHash(result.certId, 16)}
                    </span>
                  </div>
                  <div className="success-detail__row">
                    <span className="success-detail__label">Transaction</span>
                    <span className="success-detail__value mono">
                      {formatHash(result.txHash, 16)}
                    </span>
                  </div>
                  <div className="success-detail__row">
                    <span className="success-detail__label">Statut</span>
                    <Badge variant="valid" pulse />
                  </div>
                </div>
              </Card>

              <Card variant="elevated">
                <div className="success-qr-section">
                  <div className="success-qr-label">URL de vérification</div>
                  <div className="success-qr-url mono">{verifyUrl}</div>

                  <div className="success-qr-code">
                    <p className="success-qr-text">Scanner pour vérifier</p>
                    <QRCodeSVG
                      value={verifyUrl}
                      size={220}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(verifyUrl)}
                  >
                    Copier l'URL
                  </Button>
                </div>
              </Card>
            </div>

            <div className="issue-success__actions">
              <Button
                variant="gold"
                size="sm"
                onClick={() => generateCertifiedPdf(verifyUrl)}
              >
                Télécharger le PDF certifié
              </Button>

              <Button variant="gold" size="lg" onClick={handleReset}>
                Émettre un nouveau certificat
              </Button>
            </div>
          </div>
        </div>

        <style>{STYLES}</style>
      </div>
    );
  }

  return (
    <div className="issue-page">
      <div className="page-container">
        <div className="page-header animate-fade-in">
          <div className="page-eyebrow">
            <span className="eyebrow-line" />
            Établissement accrédité
            <span className="eyebrow-line" />
          </div>
          <h1 className="page-title">Émettre un certificat</h1>
          <p className="page-subtitle">
            Remplissez les informations du diplôme. Le hash des données sera
            enregistré de façon permanente sur la blockchain.
          </p>
        </div>

        {wallet.status !== "connected" ? (
          <Card variant="gold" animate className="issue-wallet-gate">
            <div className="wallet-gate">
              <span className="wallet-gate__icon">⬡</span>
              <h3>Connexion wallet requise</h3>
              <p>
                Seul un établissement accrédité peut émettre des certificats.
              </p>
              <Button variant="gold" size="lg" onClick={connect}>
                Connecter MetaMask
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="issue-form-layout">
              <div className="issue-form-fields">
                <Card variant="elevated" animate delay={100}>
                  <div className="form-section">
                    <h3 className="form-section__title">
                      <span>◉</span> Informations du diplômé
                    </h3>
                    <div className="form-grid">
                      <Input
                        label="Nom complet"
                        value={form.recipientName}
                        onChange={update("recipientName")}
                        placeholder="Alice Martin"
                        error={errors.recipientName}
                        required
                      />
                      <Input
                        label="Adresse Ethereum (optionnel)"
                        value={form.recipientAddr}
                        onChange={update("recipientAddr")}
                        placeholder="0x..."
                        error={errors.recipientAddr}
                      />
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" animate delay={200}>
                  <div className="form-section">
                    <h3 className="form-section__title">
                      <span>◈</span> Détails du diplôme
                    </h3>
                    <div className="form-grid">
                      <Input
                        label="Intitulé du diplôme"
                        value={form.diplomaTitle}
                        onChange={update("diplomaTitle")}
                        placeholder="Master en Informatique"
                        error={errors.diplomaTitle}
                        required
                      />

                      <div className="field">
                        <label className="field__label">Mention</label>
                        <select
                          className="field__select"
                          value={form.mention}
                          onChange={update("mention")}
                        >
                          <option value="">Sélectionner une mention</option>
                          {MENTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Date d'obtention"
                        type="date"
                        value={form.date}
                        onChange={update("date")}
                        error={errors.date}
                        required
                      />
                    </div>
                  </div>
                </Card>

                {status === "error" && error && (
                  <Card variant="error" animate>
                    <div className="form-error">
                      <span>⚠</span>
                      <div>
                        <strong>Transaction échouée</strong>
                        <p>{error}</p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="form-actions">
                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    loading={["hashing", "pending", "mining"].includes(status)}
                  >
                    {status === "hashing"
                      ? "Calcul du hash..."
                      : status === "pending"
                        ? "En attente de signature..."
                        : status === "mining"
                          ? "Confirmation en cours..."
                          : "Émettre le certificat"}
                  </Button>
                </div>
              </div>
              {/* Right: Preview */}
              <div className="issue-preview">
                <Card variant="gold" animate delay={300}>
                  <h3 className="preview-title">Aperçu on-chain</h3>

                  <div className="preview-cert">
                    <div className="preview-cert__logo">⬡ CertChain</div>

                    <div className="preview-cert__diploma">
                      {form.diplomaTitle || "Intitulé du diplôme"}
                    </div>

                    <div className="preview-cert__name">
                      {form.recipientName || "Nom du diplômé"}
                    </div>

                    {form.mention && (
                      <div className="preview-cert__mention">
                        {form.mention}
                      </div>
                    )}

                    {form.date && (
                      <div className="preview-cert__date">
                        {new Date(form.date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>

                  <div className="preview-info">
                    <div className="preview-info__row">
                      <span>Réseau</span>
                      <span className="mono">Hardhat / Sepolia</span>
                    </div>

                    <div className="preview-info__row">
                      <span>Standard</span>
                      <span className="mono">ERC-721</span>
                    </div>

                    <div className="preview-info__row">
                      <span>Données</span>
                      <span className="mono">SHA-256 (RGPD)</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
  .issue-page {
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
    color: var(--white); margin-bottom: var(--space-4);
  }

  .page-subtitle {
    font-size: 15px; color: var(--white-40);
    max-width: 520px; margin: 0 auto; line-height: 1.7;
  }

  /* Wallet gate */
  .issue-wallet-gate { max-width: 480px; margin: 0 auto; }
  .wallet-gate {
    text-align: center; padding: var(--space-8) 0;
    display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
  }
  .wallet-gate__icon { font-size: 40px; color: var(--gold); }
  .wallet-gate h3 { font-family: var(--font-display); font-size: 22px; }
  .wallet-gate p { font-size: 14px; color: var(--white-40); }

  /* Form layout */

  .issue-form-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: var(--space-6);
    align-items: start;
  }

  .issue-form-fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
  }

  .issue-form-fields { display: flex; flex-direction: column; gap: var(--space-4); }

  .form-section__title {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--gold); margin-bottom: var(--space-5);
    display: flex; align-items: center; gap: 8px;
  }

  .form-grid { display: flex; flex-direction: column; gap: var(--space-4); }

  .field { display: flex; flex-direction: column; gap: 6px; }

  .field__label {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--white-40);
  }

  .field__select {
    width: 100%; background: var(--bg-glass); border: var(--border-glass);
    border-radius: var(--radius-md); padding: 12px 16px;
    font-family: var(--font-body); font-size: 14px; color: var(--white);
    outline: none; cursor: pointer;
    transition: all var(--duration-normal) var(--ease-smooth);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
  }

  .field__select:focus {
    border-color: rgba(201,168,76,0.4);
    background-color: rgba(201,168,76,0.03);
  }

  .field__select option { background: var(--bg-elevated); color: var(--white); }

  .form-error {
    display: flex; align-items: flex-start; gap: var(--space-4);
    font-size: 14px;
  }
  .form-error span { font-size: 18px; color: var(--error); flex-shrink: 0; }
  .form-error strong { display: block; color: var(--white); margin-bottom: 4px; }
  .form-error p { color: var(--white-40); margin: 0; }

  .form-actions { display: flex; justify-content: flex-start; }

  /* Preview */
  .issue-preview { position: sticky; top: calc(64px + 24px); }

  .preview-title {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--gold); margin-bottom: var(--space-5);
  }

  .preview-cert {
    padding: var(--space-5);
    background: rgba(201,168,76,0.04);
    border-radius: var(--radius-md);
    border: 1px solid rgba(201,168,76,0.15);
    margin-bottom: var(--space-5);
  }

  .preview-cert__logo {
    font-family: var(--font-display); font-size: 12px;
    color: var(--gold); margin-bottom: var(--space-4);
  }

  .preview-cert__diploma {
    font-family: var(--font-display); font-size: 16px;
    color: var(--white); margin-bottom: 4px;
    min-height: 24px;
  }

  .preview-cert__name {
    font-family: var(--font-display); font-size: 22px;
    font-style: italic; color: var(--gold);
    min-height: 32px;
  }

  .preview-cert__mention {
    font-size: 13px; color: var(--white-40); margin-top: 4px;
  }

  .preview-cert__date {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--white-40); margin-top: var(--space-3);
  }

  .preview-info {
    display: flex; flex-direction: column; gap: 8px;
  }

  .preview-info__row {
    display: flex; justify-content: space-between;
    font-size: 12px; color: var(--white-40);
  }

  .preview-info__row .mono {
    font-family: var(--font-mono); color: var(--white-70);
  }

  /* Success */
  .issue-success {
    max-width: 600px; margin: 0 auto;
    text-align: center; padding: var(--space-10) 0;
  }
    

  .issue-success__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--success-dim); border: 2px solid rgba(45,212,160,0.4);
    color: var(--success); font-size: 32px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto var(--space-6);
    box-shadow: 0 0 40px rgba(45,212,160,0.2);
  }

  .issue-success__title {
    font-family: var(--font-display); font-size: 32px;
    font-weight: 300; color: var(--white); margin-bottom: var(--space-3);
  }

  .issue-success__subtitle {
    font-size: 15px; color: var(--white-40);
    line-height: 1.7; margin-bottom: var(--space-8);
  }

  .issue-success__details {
    display: flex; flex-direction: column; gap: var(--space-4);
    text-align: left; margin-bottom: var(--space-8);
  }

  .success-detail { display: flex; flex-direction: column; gap: var(--space-3); }

  .success-detail__row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px;
  }

  .success-detail__label { color: var(--white-40); }
  .success-detail__value { color: var(--white-70); }
  .success-detail__value.mono { font-family: var(--font-mono); font-size: 12px; }

  .success-qr-section { display: flex; flex-direction: column; gap: var(--space-3); }
  .success-qr-label {
    font-family: var(--font-mono); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.1em; color: var(--gold);
  }
  .success-qr-url {
    font-family: var(--font-mono); font-size: 12px;
    color: var(--white-70); word-break: break-all;
    padding: var(--space-3); background: var(--bg-glass);
    border-radius: var(--radius-sm);
  }

  .success-qr-code {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: var(--radius-md);
    margin-top: var(--space-2);
}

  .success-qr-text {
    font-size: 13px;
    color: var(--white-40);
    margin: 0;
  }

  .issue-success__actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 32px;
  flex-wrap: wrap;
}

  .issue-success__actions button {
    min-width: 300px;
    box-shadow: 0 8px 30px rgba(201,168,76,0.18);
  }

    .mono { font-family: var(--font-mono); }

    @media (max-width: 860px) {
      .issue-form-layout { grid-template-columns: 1fr; }
      .issue-preview { position: static; }
    }
  `;
