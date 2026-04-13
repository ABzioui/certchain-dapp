import React, { useState, useEffect } from "react";
import { useVerify } from "../hooks/useVerify";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { truncateAddress, formatTimestamp, formatHash } from "../utils/crypto";
import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Lire le certId depuis l'URL si présent
function getCertIdFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("certId") ?? "";
}

export function VerifyPage() {
  const { verify, status, result, error, reset } = useVerify();

  const [certId, setCertId] = useState(getCertIdFromUrl());
  const [pdfLoading, setPdfLoading] = useState(false);

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
    setCertId("");
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPdfLoading(true);
      reset();

      const pdfBytes = await file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: pdfBytes,
        useWorkerFetch: false,
        isEvalSupported: false,
      });

      const pdf = await loadingTask.promise;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context introuvable");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      }).promise;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const qr = jsQR(imageData.data, imageData.width, imageData.height);

      if (!qr?.data) {
        alert("QR code introuvable dans le PDF");
        return;
      }

      const url = new URL(qr.data);
      const extractedCertId = url.searchParams.get("certId");

      if (!extractedCertId) {
        alert("CertID introuvable dans le QR");
        return;
      }

      setCertId(extractedCertId);
    } catch (err) {
      console.error("PDF READ ERROR:", err);
      alert("Impossible de lire le PDF");
    } finally {
      setPdfLoading(false);
    }
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
            Entrez l'identifiant du certificat ou importez un PDF certifié pour
            vérifier automatiquement son authenticité.
          </p>
        </div>

        {/* Search Form */}
        <Card className="verify-search animate-fade-in delay-100">
          <form onSubmit={handleSubmit}>
            <div className="verify-search__field">
              <Input
                label="Identifiant du certificat (CertID)"
                value={certId}
                onChange={(e) => {
                  setCertId(e.target.value);
                  reset();
                }}
                placeholder="0x4a2f8e91c3b5d07a1f6e924..."
                icon={<span>◈</span>}
                hint="Format : hash hexadécimal 0x..."
              />

              <Button
                variant="gold"
                size="md"
                type="submit"
                loading={status === "loading"}
                disabled={!certId.trim()}
              >
                Vérifier
              </Button>
            </div>

            {/* ✅ Import PDF */}
            <div style={{ marginTop: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "var(--white-40)",
                }}
              >
                Ou importer un PDF certifié
              </label>

              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfImport}
              />
            </div>
          </form>
        </Card>

        {/* Loading PDF */}
        {pdfLoading && (
          <div className="verify-loading animate-fade-in">
            <div className="verify-loading__spinner" />
            <div className="verify-loading__text">
              Lecture du QR dans le PDF...
            </div>
          </div>
        )}

        {/* Loading blockchain */}
        {status === "loading" && !pdfLoading && (
          <div className="verify-loading animate-fade-in">
            <div className="verify-loading__spinner" />
            <div className="verify-loading__text">
              Interrogation de la blockchain...
            </div>
          </div>
        )}

        {/* Not Found */}
        {status === "not_found" && (
          <Card variant="error" animate>
            <div className="verify-notfound">
              <span className="verify-notfound__icon">◎</span>
              <h3>Certificat introuvable</h3>
              <p>
                Aucun certificat ne correspond à cet identifiant sur la
                blockchain.
              </p>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Nouvelle recherche
              </Button>
            </div>
          </Card>
        )}

        {/* Error */}
        {status === "error" && error && (
          <Card variant="error" animate>
            <div className="verify-notfound">
              <span className="verify-notfound__icon">⚠</span>
              <h3>Erreur de connexion</h3>
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Result */}
        {status === "found" && result && (
          <div className="verify-result animate-fade-in">
            <div
              className={`verify-banner ${
                result.isValid
                  ? "verify-banner--valid"
                  : "verify-banner--invalid"
              }`}
            >
              <div className="verify-banner__icon">
                {result.isValid ? "✓" : "✗"}
              </div>

              <div className="verify-banner__content">
                <div className="verify-banner__title">
                  {result.isValid
                    ? "Certificat authentique"
                    : "Certificat révoqué"}
                </div>

                <div className="verify-banner__subtitle">
                  {result.isValid
                    ? "Ce certificat est valide et enregistré sur la blockchain."
                    : "Ce certificat a été révoqué."}
                </div>
              </div>

              <Badge
                variant={result.isValid ? "valid" : "revoked"}
                pulse={result.isValid}
              />
            </div>

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
          width: 32px;
          height: 1px;
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

        .verify-search {
          margin-bottom: var(--space-8);
        }

        .verify-search__field {
          display: flex;
          gap: var(--space-4);
          align-items: flex-end;
        }

        .verify-search__field > *:first-child {
          flex: 1;
        }

        .verify-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-12);
        }

        .verify-loading__spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--gold-dim);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .verify-actions {
          display: flex;
          justify-content: center;
          margin-top: var(--space-6);
        }

        @media (max-width: 640px) {
          .verify-search__field {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
